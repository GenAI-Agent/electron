/**
 * Webview 內 Google 登入頁面
 */

import React from 'react';
import { useRouter } from 'next/router';
import WebviewLogin from '@/components/WebviewLogin';

export default function WebviewLoginPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      {/* 頂部導航 */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/')}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ← 返回首頁
              </button>
              <h1 className="text-lg font-semibold text-foreground">
                Webview Google 登入
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/browser')}
                className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
              >
                瀏覽器頁面
              </button>
              <button
                onClick={() => router.push('/gmail-auth')}
                className="px-3 py-2 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-md transition-colors"
              >
                OAuth 登入
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主要內容 */}
      <div className="py-8">
        <WebviewLogin />
      </div>

      {/* 底部說明 */}
      <div className="mt-12 border-t border-border bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-foreground mb-3">OAuth vs Webview 登入差異</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>
                  <strong className="text-foreground">OAuth 登入:</strong>
                  <br />• 獲得 API Access Token
                  <br />• 可直接調用 Google API
                  <br />• 網頁界面仍顯示未登入
                </div>
                <div>
                  <strong className="text-foreground">Webview 登入:</strong>
                  <br />• 獲得瀏覽器 Cookie
                  <br />• 網頁界面顯示已登入
                  <br />• 可正常使用 Gmail 網頁功能
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-foreground mb-3">建議使用場景</h3>
              <div className="text-sm text-muted-foreground space-y-2">
                <div>
                  <strong className="text-foreground">API 自動化:</strong>
                  <br />使用 OAuth Access Token 直接調用 Gmail API
                </div>
                <div>
                  <strong className="text-foreground">網頁自動化:</strong>
                  <br />使用 Webview Cookie 登入在網頁上操作
                </div>
                <div>
                  <strong className="text-foreground">混合使用:</strong>
                  <br />同時擁有 API Token 和 Cookie，靈活選擇方式
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}