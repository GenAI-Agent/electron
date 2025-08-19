/**
 * Google OAuth 認證組件
 * 使用桌面 OAuth 2.0 流程進行 Google 登入授權
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
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
  const [showCancelOption, setShowCancelOption] = useState(false);

  const steps = [
    '準備授權',
    '瀏覽器授權',
    '獲取 Token',
    '完成'
  ];

  // OAuth 配置 - Client ID 可以暴露，但 Client Secret 必須保密
  const oauthConfig: OAuthConfig = {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
    clientSecret: '', // Client Secret 應該從後端獲取或在 Electron 主進程中處理
    scope: 'openid email profile'
  };

  const handleStartAuth = useCallback(async () => {
    if (!oauthConfig.clientId) {
      setAuthResult({
        success: false,
        error: '請設定 Google OAuth 客戶端 ID'
      });
      return;
    }

    setIsAuthenticating(true);
    setAuthResult(null);
    setActiveStep(0);
    setShowCancelOption(false);

    try {
      // 步驟 1: 準備授權
      setActiveStep(1);

      // 顯示取消選項（在瀏覽器授權階段）
      setTimeout(() => {
        if (isAuthenticating) {
          setShowCancelOption(true);
        }
      }, 2000);

      // 啟動 OAuth 流程（Client Secret 在 Electron 主進程中處理）
      const flowResult = await window.electronAPI.oauth.startFlow({
        clientId: oauthConfig.clientId,
        clientSecret: '',
        scope: oauthConfig.scope
      });

      if (!flowResult.success) {
        throw new Error(flowResult.error || '啟動 OAuth 流程失敗');
      }

      // 步驟 2: 瀏覽器授權完成，獲取 Token
      setActiveStep(2);
      setShowCancelOption(false);

      const tokenResult = await window.electronAPI.oauth.exchangeToken({
        code: flowResult.code || '',
        clientId: oauthConfig.clientId,
        clientSecret: '',
      });

      if (!tokenResult.success) {
        throw new Error(tokenResult.error || 'Token 交換失敗');
      }

      // 步驟 3: 完成
      setActiveStep(3);

      // 步驟 4: 直接注入 access token 到 webview
      console.log('🎯 正在直接注入 access token 到 webview...');
      try {
        const syncResult = await window.electronAPI.oauth.syncGoogleCookies(tokenResult.tokens!);
        console.log('🎯 直接注入結果:', syncResult);

        if (syncResult.success && syncResult.userInfo) {
          console.log(`✅ Access token 已直接注入`, `(${syncResult.userInfo.email})`);

          // 保存認證數據供後續使用
          const authData = {
            access_token: tokenResult.tokens!.access_token,
            user_info: syncResult.userInfo,
            expires_at: Date.now() + ((tokenResult.tokens!.expires_in || 3600) * 1000)
          };

          // 保存到 sessionStorage 供瀏覽器頁面使用
          try {
            sessionStorage.setItem('pending_google_auth', JSON.stringify(authData));
            console.log('💾 認證狀態已保存，將在瀏覽器頁面中自動注入');

            // 立即嘗試注入到現有的 webview
            setTimeout(async () => {
              try {
                const injectResult = await window.electronAPI.oauth.injectWebviewToken(authData);
                console.log('💉 立即注入結果:', injectResult);
              } catch (injectError) {
                console.warn('立即注入失敗:', injectError);
              }
            }, 1000);

          } catch (storageError) {
            console.warn('保存認證狀態時出錯:', storageError);
          }
        } else {
          console.warn('⚠️ Access token 注入失敗:', syncResult.error);
        }
      } catch (syncError) {
        console.warn('注入 access token 過程中出錯:', syncError);
      }

      setAuthResult({
        success: true,
        tokens: tokenResult.tokens
      });

      // 這裡可以將 token 發送到後端保存
      console.log('OAuth 成功，Token:', tokenResult.tokens);

    } catch (error) {
      console.error('OAuth 錯誤:', error);

      const errorMessage = error instanceof Error ? error.message : '未知錯誤';

      // 特別處理用戶拒絕授權的情況
      let displayMessage = errorMessage;
      if (errorMessage.includes('access_denied')) {
        displayMessage = '您已取消授權，請重新嘗試';
      } else if (errorMessage.includes('OAuth error')) {
        displayMessage = '授權過程中出現錯誤，請重新嘗試';
      }

      setAuthResult({
        success: false,
        error: displayMessage
      });

      // 確保清理 OAuth 流程
      try {
        await window.electronAPI.oauth.stopFlow();
      } catch (stopError) {
        console.error('停止 OAuth 流程時出錯:', stopError);
      }
    } finally {
      // 確保狀態被重置
      setIsAuthenticating(false);
      setShowCancelOption(false);
      setActiveStep(0);
    }
  }, [oauthConfig, isAuthenticating]);

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

  const handleNavigateToGoogle = useCallback(async () => {
    try {
      // 導航到 browser 頁面並加載 Google
      router.push('/browser?url=https://www.google.com');
      console.log('已導航到 Browser 頁面，Google 登入狀態應該已保持');
    } catch (error) {
      console.error('導航錯誤:', error);
    }
  }, [router]);

  // 組件卸載時清理 OAuth 流程
  useEffect(() => {
    return () => {
      if (isAuthenticating) {
        // 靜默地停止 OAuth 流程，不需要更新狀態
        window.electronAPI?.oauth?.stopFlow().catch(console.error);
      }
    };
  }, [isAuthenticating]);

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

        {authResult && (
          <div className={cn(
            "p-4 mb-4 rounded-lg border",
            authResult.success
              ? "bg-green-50 border-green-200 text-green-900"
              : "bg-red-50 border-red-200 text-red-900"
          )}>
            {authResult.success ? (
              <div>
                <h3 className="font-semibold mb-1">🎯 Access Token 已成功注入！</h3>
                <p className="text-sm mt-1">
                  ✅ Google Access Token 已直接注入到 webview
                </p>
                <p className="text-sm mt-1 font-bold text-green-800">
                  現在可以使用 Google API 進行程式化操作！
                </p>
                <p className="text-xs mt-2 text-green-600">
                  💡 在 Google 頁面中可透過 window.GOOGLE_ACCESS_TOKEN 存取
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                    <span className="text-red-600 text-xs font-bold">!</span>
                  </div>
                  <h3 className="font-semibold text-red-900">登入失敗</h3>
                </div>
                <p className="text-sm text-red-700 mb-3">
                  {authResult.error}
                </p>
                {authResult.error?.includes('取消授權') && (
                  <p className="text-xs text-red-600">
                    💡 提示：您可以重新點擊「開始 Google 登入」來重新嘗試
                  </p>
                )}
              </div>
            )}
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

          {/* 成功後的操作按鈕 */}
          {authResult?.success && (
            <div className="space-y-3">
              <button
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-base shadow-sm flex items-center justify-center gap-2"
                onClick={handleNavigateToGoogle}
              >
                🎯 前往 Google (Token 已注入)
              </button>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  如果 Gmail 仍顯示未登入，可以嘗試 webview 內登入：
                </p>
                <button
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors text-sm font-medium border border-blue-200"
                  onClick={() => router.push('/webview-login')}
                >
                  🔗 Webview 內登入 (獲得 Cookie)
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
