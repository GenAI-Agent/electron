/**
 * Webview 內 Google 登入組件
 * 引導用戶在 webview 中完成 Google 登入以獲得 Cookie
 */

import React, { useState, useCallback } from 'react';
import { Loader2, Check, Eye, AlertCircle, LogIn } from 'lucide-react';
import { cn } from '@/utils/cn';

interface LoginStatus {
  url: string;
  hostname: string;
  isOnGmail: boolean;
  hasUserElements: boolean;
  hasAccountMenu: boolean;
  urlIndicatesLogin: boolean;
  likelyLoggedIn: boolean;
}

interface CookieDebugInfo {
  cookies: any;
  authCookies: Array<{
    domain: string;
    name: string;
    hasValue: boolean;
  }>;
  hasGoogleAuth: boolean;
}

const WebviewLogin: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState<LoginStatus | null>(null);
  const [cookieInfo, setCookieInfo] = useState<CookieDebugInfo | null>(null);
  const [showCookieDetails, setShowCookieDetails] = useState(false);

  const handleStartWebviewLogin = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await window.electronAPI.oauth.startWebviewGoogleLogin();
      if (result.success) {
        console.log('✅ Webview 登入已啟動:', result.message);
        // 等待一段時間後自動檢查狀態
        setTimeout(() => {
          handleCheckLoginStatus();
        }, 2000);
      } else {
        console.error('❌ 啟動 webview 登入失敗:', result.error);
      }
    } catch (error) {
      console.error('Webview 登入錯誤:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCheckLoginStatus = useCallback(async () => {
    try {
      const result = await window.electronAPI.oauth.checkWebviewLoginStatus();
      if (result.success && result.status) {
        setLoginStatus(result.status);
        console.log('登入狀態:', result.status);
      } else {
        console.error('檢查登入狀態失敗:', result.error);
      }
    } catch (error) {
      console.error('檢查登入狀態錯誤:', error);
    }
  }, []);

  const handleDebugCookies = useCallback(async () => {
    try {
      const result = await window.electronAPI.oauth.debugWebviewCookies();
      if (result.success) {
        setCookieInfo({
          cookies: result.cookies || {},
          authCookies: result.authCookies || [],
          hasGoogleAuth: result.hasGoogleAuth || false
        });
        console.log('Cookie 資訊:', result);
      } else {
        console.error('獲取 Cookie 資訊失敗:', result.error);
      }
    } catch (error) {
      console.error('Cookie 調試錯誤:', error);
    }
  }, []);

  const getStatusColor = (isLoggedIn: boolean) => {
    return isLoggedIn ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isLoggedIn: boolean) => {
    return isLoggedIn ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />;
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-card rounded-xl shadow-lg border border-border">
      <div className="p-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Webview Google 登入
          </h2>
          <p className="text-muted-foreground text-sm">
            在 webview 中完成 Google 登入以獲得實際的登入 Cookie
          </p>
        </div>

        {/* 操作按鈕 */}
        <div className="space-y-4 mb-6">
          <button
            className={cn(
              "w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2",
              isLoading 
                ? "bg-primary/70 text-primary-foreground cursor-not-allowed" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            onClick={handleStartWebviewLogin}
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {isLoading ? '啟動中...' : '啟動 Webview 登入'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
              onClick={handleCheckLoginStatus}
            >
              <Eye className="w-4 h-4" />
              檢查登入狀態
            </button>

            <button
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
              onClick={handleDebugCookies}
            >
              <Eye className="w-4 h-4" />
              檢查 Cookies
            </button>
          </div>
        </div>

        {/* 登入狀態顯示 */}
        {loginStatus && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              {getStatusIcon(loginStatus.likelyLoggedIn)}
              <span className={getStatusColor(loginStatus.likelyLoggedIn)}>
                登入狀態檢查
              </span>
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">當前 URL:</span>
                <span className="text-xs font-mono bg-muted-foreground/10 px-2 py-1 rounded max-w-[300px] truncate">
                  {loginStatus.url}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">在 Gmail 頁面:</span>
                <span className={loginStatus.isOnGmail ? 'text-green-600' : 'text-red-600'}>
                  {loginStatus.isOnGmail ? '是' : '否'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">有用戶元素:</span>
                <span className={loginStatus.hasUserElements ? 'text-green-600' : 'text-red-600'}>
                  {loginStatus.hasUserElements ? '是' : '否'}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL 顯示已登入:</span>
                <span className={loginStatus.urlIndicatesLogin ? 'text-green-600' : 'text-red-600'}>
                  {loginStatus.urlIndicatesLogin ? '是' : '否'}
                </span>
              </div>
              
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">整體判斷:</span>
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    loginStatus.likelyLoggedIn 
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  )}>
                    {loginStatus.likelyLoggedIn ? '已登入' : '未登入'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cookie 資訊顯示 */}
        {cookieInfo && (
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Cookie 資訊
              </h3>
              <button
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={() => setShowCookieDetails(!showCookieDetails)}
              >
                {showCookieDetails ? '隱藏詳情' : '顯示詳情'}
              </button>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Google 認證 Cookies:</span>
                <span className={cookieInfo.hasGoogleAuth ? 'text-green-600' : 'text-red-600'}>
                  {cookieInfo.hasGoogleAuth ? `發現 ${cookieInfo.authCookies.length} 個` : '無'}
                </span>
              </div>
              
              {cookieInfo.authCookies.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">認證 Cookies:</div>
                  <div className="space-y-1">
                    {cookieInfo.authCookies.map((cookie, index) => (
                      <div key={index} className="flex justify-between text-xs">
                        <span className="font-mono">{cookie.name}</span>
                        <span className="text-muted-foreground">{cookie.domain}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {showCookieDetails && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs text-muted-foreground mb-2">詳細 Cookie 資訊:</div>
                <pre className="text-xs bg-black/5 p-3 rounded overflow-auto max-h-40">
                  {JSON.stringify(cookieInfo.cookies, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 使用說明 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-800 mb-2">使用說明</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. 點擊「啟動 Webview 登入」將導航到 Google 登入頁面</p>
            <p>2. 在 webview 中完成正常的 Google 登入流程</p>
            <p>3. 登入完成後，點擊「檢查登入狀態」確認狀態</p>
            <p>4. 使用「檢查 Cookies」驗證是否獲得了認證 Cookie</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebviewLogin;