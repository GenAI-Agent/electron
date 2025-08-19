/**
 * Google OAuth 認證組件
 * 使用桌面 OAuth 2.0 流程進行 Google 登入授權
 */

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { cn } from '@/utils/cn';
import { Check, Loader2 } from 'lucide-react';

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
  const [showCancelOption, setShowCancelOption] = useState(false);

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
        code: flowResult.code || ''
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
      setShowCancelOption(false);
    } catch (error) {
      console.error('停止 OAuth 流程錯誤:', error);
    }
  }, []);

  const handleWebsiteClick = (websiteUrl: string) => {
    router.push(`/browser?url=${encodeURIComponent(websiteUrl)}`);
  };

  return (
    <div className="max-w-[500px] mx-auto mt-8 bg-card rounded-xl shadow-lg border border-border">
      <div className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Google OAuth 登入
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            使用 OAuth 2.0 + PKCE 進行安全的 Google 帳戶登入
          </p>
        </div>

        {isAuthenticating && (
          <div className="mb-8">
            <div className="relative">
              {/* 連接線背景 */}
              <div className="absolute top-4 left-8 right-8 h-0.5 bg-gray-200"></div>
              <div
                className={cn(
                  "absolute top-4 left-8 h-0.5 bg-primary transition-all duration-500",
                  activeStep === 0 ? "w-0" :
                    activeStep === 1 ? "w-1/3" :
                      activeStep === 2 ? "w-2/3" :
                        "w-full"
                )}
              ></div>

              {/* 步驟圓圈 */}
              <div className="flex justify-between relative z-10">
                {steps.map((label, index) => (
                  <div key={label} className="flex flex-col items-center">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 bg-white transition-colors duration-300",
                      index < activeStep ? "bg-primary text-white border-primary" :
                        index === activeStep ? "bg-primary text-white border-primary" :
                          "bg-white text-gray-500 border-gray-200"
                    )}>
                      {index < activeStep ? <Check className="w-4 h-4" /> : index + 1}
                    </div>
                    <span className={cn(
                      "text-xs mt-2 text-center max-w-[60px] leading-tight",
                      index <= activeStep ? "text-primary font-medium" : "text-gray-500"
                    )}>
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* 主要操作按鈕 */}
          {!isAuthenticating && !authResult?.success && (
            <button
              className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium text-base shadow-sm"
              onClick={handleStartAuth}
            >
              開始 Google 登入
            </button>
          )}

          {/* 登入進行中的狀態 */}
          {isAuthenticating && (
            <div className="space-y-4">
              <button
                className="w-full px-6 py-4 bg-primary text-primary-foreground rounded-lg opacity-75 cursor-not-allowed flex items-center justify-center gap-2 font-medium text-base"
                disabled
              >
                <Loader2 className="w-5 h-5 animate-spin" />
                登入中...
              </button>

              {/* 取消按鈕（在適當的時機顯示） */}
              {showCancelOption && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    如果瀏覽器沒有自動開啟，或您想取消登入：
                  </p>
                  <button
                    className="px-4 py-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-md transition-colors text-sm font-medium"
                    onClick={handleStopAuth}
                  >
                    取消登入
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 登入成功狀態 */}
          {authResult?.success && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  <span className="font-semibold text-green-900">登入成功！</span>
                </div>
                <p className="text-sm text-green-700">您現在可以前往 Google 服務</p>
              </div>

              <div className="space-y-3">
                <button
                  className="w-full px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base shadow-sm flex items-center justify-center gap-3"
                  onClick={() => handleWebsiteClick('https://mail.google.com')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#EA4335" />
                  </svg>
                  <span>前往 Gmail</span>
                </button>

                <button
                  className="w-full px-6 py-4 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-base shadow-sm flex items-center justify-center gap-3"
                  onClick={() => handleWebsiteClick('https://drive.google.com')}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8l6-6V8l-6-6H6zm7 7V3.5L18.5 9H13z" fill="#4285F4" />
                    <path d="M6 2c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8l6-6V8l-6-6H6z" fill="#34A853" fillOpacity="0.6" />
                    <path d="M13 3.5V9h5.5" fill="#FBBC04" />
                  </svg>
                  <span>前往雲端硬碟</span>
                </button>
              </div>
            </div>
          )}

          {/* 返回首頁按鈕 */}
          <div className="pt-4 border-t border-border">
            <button
              className="w-full px-4 py-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors text-sm"
              onClick={() => router.push('/')}
              disabled={isAuthenticating}
            >
              ← 返回首頁
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuth;
