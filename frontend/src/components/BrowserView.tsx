import React, { useEffect, useRef } from 'react';

interface BrowserViewProps {
  url: string;
  disablePointerEvents?: boolean;
}

const BrowserView: React.FC<BrowserViewProps> = ({ url, disablePointerEvents = false }) => {
  const webviewRef = useRef<HTMLWebViewElement>(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview || !url) return;

    let formattedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      formattedUrl = `https://${url}`;
    }

    // Wait for webview to be ready
    const handleDomReady = async () => {
      console.log('Webview is ready');
      
      // 檢查是否需要注入 Google access token
      const currentUrl = webview.src || '';
      if (currentUrl.includes('google.com') || currentUrl.includes('accounts.google.com')) {
        console.log('🎯 檢測到 Google 域名，檢查是否需要注入 Access Token...');
        
        try {
          // 檢查 webview 中是否已有 access token
          const hasToken = await webview.executeJavaScript(`
            (function() {
              const accessToken = window.GOOGLE_ACCESS_TOKEN || localStorage.getItem('google_access_token');
              const userInfo = window.GOOGLE_USER_INFO || localStorage.getItem('google_user_info');
              return {
                hasAccessToken: !!accessToken,
                hasUserInfo: !!userInfo,
                tokenValue: accessToken ? accessToken.substring(0, 20) + '...' : null,
                timestamp: Date.now()
              };
            })();
          `);
          
          if (!hasToken.hasAccessToken || !hasToken.hasUserInfo) {
            console.log('⚠️ webview 中缺少 access token，嘗試從 sessionStorage 獲取...');
            
            try {
              // 檢查是否有待注入的認證狀態
              const pendingAuthStr = sessionStorage.getItem('pending_google_auth');
              if (pendingAuthStr) {
                const pendingAuth = JSON.parse(pendingAuthStr);
                console.log('🎯 找到待注入的 access token，正在注入...');
                
                // 使用新的直接 token 注入方法
                try {
                  const injectResult = await window.electronAPI.oauth.injectWebviewToken(pendingAuth);
                  if (injectResult.success) {
                    console.log('✅ Access token 成功注入到 webview');
                    sessionStorage.removeItem('pending_google_auth');
                  } else {
                    console.warn('⚠️ Token 注入失敗:', injectResult.error);
                  }
                } catch (injectError) {
                  console.warn('Token 注入過程中出錯:', injectError);
                }
                
                // 備用方案：直接在 webview 中設置
                const injectionResult = await webview.executeJavaScript(`
                  (function() {
                    try {
                      const authData = ${JSON.stringify(pendingAuth)};
                      
                      // 設置全局 access token
                      window.GOOGLE_ACCESS_TOKEN = authData.access_token;
                      window.GOOGLE_USER_INFO = authData.user_info;
                      
                      // 設置 localStorage
                      localStorage.setItem('google_access_token', authData.access_token);
                      localStorage.setItem('google_user_info', JSON.stringify(authData.user_info));
                      localStorage.setItem('google_auth_expires', authData.expires_at.toString());
                      localStorage.setItem('google_authenticated', 'true');
                      
                      // 設置 sessionStorage
                      sessionStorage.setItem('google_signed_in', 'true');
                      sessionStorage.setItem('user_email', authData.user_info.email);
                      
                      // 在頁面上顯示認證狀態指示器
                      if (window.location.hostname.includes('google.com')) {
                        // 移除之前的指示器（如果有的話）
                        const existing = document.getElementById('custom-auth-indicator');
                        if (existing) existing.remove();
                        
                        // 創建 Access Token 狀態指示器
                        const authIndicator = document.createElement('div');
                        authIndicator.id = 'custom-auth-indicator';
                        authIndicator.style.cssText = \`
                          position: fixed !important;
                          top: 60px !important;
                          right: 20px !important;
                          z-index: 999999 !important;
                          background: #0f9d58 !important;
                          color: white !important;
                          padding: 12px 18px !important;
                          border-radius: 25px !important;
                          font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                          font-size: 14px !important;
                          font-weight: 500 !important;
                          box-shadow: 0 4px 20px rgba(0,0,0,0.3) !important;
                          cursor: pointer !important;
                          max-width: 320px !important;
                          border: 2px solid white !important;
                          animation: tokenSlideIn 0.4s ease-out !important;
                        \`;
                        
                        // 添加動畫樣式
                        if (!document.getElementById('token-animation-style')) {
                          const style = document.createElement('style');
                          style.id = 'token-animation-style';
                          style.textContent = \`
                            @keyframes tokenSlideIn {
                              from { transform: translateX(100%) scale(0.9); opacity: 0; }
                              to { transform: translateX(0) scale(1); opacity: 1; }
                            }
                          \`;
                          document.head.appendChild(style);
                        }
                        
                        authIndicator.innerHTML = \`
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="font-size: 18px;">🎯</span>
                            <div>
                              <div style="font-weight: bold; font-size: 15px;">Access Token 已啟用</div>
                              <div style="font-size: 11px; opacity: 0.9; margin-top: 2px;">
                                \${authData.user_info.email} • 點擊查看詳情
                              </div>
                            </div>
                          </div>
                        \`;
                        
                        authIndicator.onclick = function() {
                          const tokenInfo = \`
🎯 Google Access Token 已成功注入！

用戶: \${authData.user_info.email}
Token: \${authData.access_token.substring(0, 40)}...
過期時間: \${new Date(authData.expires_at).toLocaleString()}

✅ 此 access token 可直接用於：
• Google API 調用 (Gmail, Drive, Calendar等)
• 無需傳統登入流程
• 程式化存取 Google 服務

💡 使用方式：
• window.GOOGLE_ACCESS_TOKEN (全局變數)
• localStorage.getItem('google_access_token')

⚠️ 注意：Google 頁面可能仍顯示未登入，
但 access token 完全有效且可用！
                          \`.trim();
                          alert(tokenInfo);
                        };
                        
                        document.body.appendChild(authIndicator);
                        
                        // 5秒後變成簡化版本
                        setTimeout(() => {
                          if (document.getElementById('custom-auth-indicator')) {
                            authIndicator.innerHTML = \`✅ \${authData.user_info.email.split('@')[0]}\`;
                            authIndicator.style.padding = '6px 10px';
                            authIndicator.style.fontSize = '11px';
                          }
                        }, 5000);
                      }
                      
                      console.log('✅ Google 認證狀態已注入到 webview');
                      return { success: true };
                    } catch (error) {
                      console.error('❌ 注入認證狀態失敗:', error);
                      return { success: false, error: error.message };
                    }
                  })();
                `);
                
                if (injectionResult.success) {
                  console.log('✅ 認證狀態注入成功');
                  // 清除待注入狀態
                  sessionStorage.removeItem('pending_google_auth');
                } else {
                  console.warn('⚠️ 認證狀態注入失敗:', injectionResult.error);
                }
              } else {
                console.log('ℹ️ 沒有找到待注入的認證狀態');
              }
            } catch (error) {
              console.error('處理認證狀態注入時出錯:', error);
            }
          } else {
            console.log('✅ webview 中已有認證狀態');
          }
        } catch (error) {
          console.warn('檢查認證狀態時出錯:', error);
        }
      }
    };

    const handleDidFailLoad = (event: any) => {
      console.error('Failed to load:', event.errorDescription);
    };

    const handleDidStartLoading = () => {
      console.log('Started loading:', formattedUrl);
    };

    // Add event listeners
    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('did-start-loading', handleDidStartLoading);

    // Set the URL
    webview.src = formattedUrl;

    // Cleanup
    return () => {
      if (webview.removeEventListener) {
        webview.removeEventListener('dom-ready', handleDomReady);
        webview.removeEventListener('did-fail-load', handleDidFailLoad);
        webview.removeEventListener('did-start-loading', handleDidStartLoading);
      }
    };
  }, [url]);

  return (
    <div className="w-full h-full bg-white relative min-w-[200px] pr-1">
      {/* Debug panel */}
      <div className="absolute top-2 right-2 z-50 flex gap-2">
        <button
          onClick={async () => {
            try {
              const result = await window.electronAPI.debug.checkWebviewCookies();
              console.log('Webview cookies debug:', result);
              
              // 檢查 webview 中的認證狀態
              const webview = webviewRef.current;
              if (webview) {
                const authCheck = await webview.executeJavaScript(`
                  (function() {
                    const authToken = localStorage.getItem('google_auth_token');
                    const userInfo = localStorage.getItem('google_user_info');
                    const signedIn = sessionStorage.getItem('google_signed_in');
                    const userEmail = sessionStorage.getItem('user_email');
                    
                    return {
                      hasToken: !!authToken,
                      hasUserInfo: !!userInfo,
                      signedIn: signedIn,
                      userEmail: userEmail,
                      indicator: !!document.getElementById('custom-auth-indicator'),
                      currentUrl: window.location.href
                    };
                  })();
                `);
                
                const summary = `
🍪 Cookie 狀態: ${result.success ? '✅' : '❌'}
🎫 認證 Token: ${authCheck?.hasToken ? '✅' : '❌'}
👤 用戶信息: ${authCheck?.hasUserInfo ? '✅' : '❌'}
🔐 登入狀態: ${authCheck?.signedIn ? '✅' : '❌'}
📧 用戶郵箱: ${authCheck?.userEmail || '無'}
🏷️ 認證指示器: ${authCheck?.indicator ? '✅ 已顯示' : '❌ 未顯示'}
🌐 當前頁面: ${authCheck?.currentUrl?.substring(0, 50)}...

詳細信息請查看 console
                `.trim();
                
                alert(summary);
              }
            } catch (error) {
              console.error('Debug error:', error);
              alert('Debug error - see console');
            }
          }}
          className="px-3 py-1 bg-blue-500 text-white text-xs rounded shadow hover:bg-blue-600"
        >
          🔍 狀態
        </button>
        
        <button
          onClick={async () => {
            try {
              const webview = webviewRef.current;
              if (!webview) {
                alert('❌ Webview 不可用');
                return;
              }
              
              // 手動觸發認證指示器
              const result = await webview.executeJavaScript(`
                (function() {
                  try {
                    // 移除現有指示器
                    const existing = document.getElementById('custom-auth-indicator');
                    if (existing) existing.remove();
                    
                    // 檢查是否有認證信息
                    const authToken = localStorage.getItem('google_auth_token');
                    const userEmail = sessionStorage.getItem('user_email') || 'sa556693828@gmail.com';
                    
                    if (!authToken && !localStorage.getItem('google_authenticated')) {
                      return { success: false, message: '沒有找到認證狀態' };
                    }
                    
                    // 創建認證指示器
                    const authIndicator = document.createElement('div');
                    authIndicator.id = 'custom-auth-indicator';
                    authIndicator.style.cssText = \`
                      position: fixed !important;
                      top: 60px !important;
                      right: 20px !important;
                      z-index: 999999 !important;
                      background: #4285f4 !important;
                      color: white !important;
                      padding: 12px 16px !important;
                      border-radius: 20px !important;
                      font-family: -apple-system, BlinkMacSystemFont, sans-serif !important;
                      font-size: 14px !important;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
                      cursor: pointer !important;
                      max-width: 280px !important;
                      border: 2px solid white !important;
                    \`;
                    authIndicator.innerHTML = \`
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-size: 16px;">✅</span>
                        <div>
                          <div style="font-weight: bold;">OAuth 認證成功</div>
                          <div style="font-size: 12px; opacity: 0.9; margin-top: 2px;">
                            \${userEmail}
                          </div>
                        </div>
                      </div>
                    \`;
                    
                    authIndicator.onclick = function() {
                      alert('🎉 Google OAuth 認證成功!\\n\\n用戶: ' + userEmail + '\\n\\n雖然 Google 頁面可能沒有顯示傳統登入狀態，但 OAuth token 完全有效，可以用於所有 Google API 調用！');
                    };
                    
                    document.body.appendChild(authIndicator);
                    
                    // 添加進入/退出動畫
                    setTimeout(() => {
                      authIndicator.style.transform = 'scale(1.05)';
                      setTimeout(() => {
                        authIndicator.style.transform = 'scale(1)';
                      }, 150);
                    }, 100);
                    
                    console.log('✅ OAuth 認證指示器已添加');
                    return { success: true, message: '認證指示器已添加' };
                  } catch (error) {
                    console.error('創建指示器失敗:', error);
                    return { success: false, message: error.message };
                  }
                })();
              `);
              
              if (result.success) {
                alert('✅ 認證指示器已成功添加到頁面右上角！');
              } else {
                alert('❌ 添加指示器失敗: ' + result.message);
              }
            } catch (error) {
              console.error('Manual indicator error:', error);
              alert('操作失敗 - 請查看 console');
            }
          }}
          className="px-3 py-1 bg-green-500 text-white text-xs rounded shadow hover:bg-green-600"
        >
          ✅ 顯示
        </button>
      </div>
      
      <webview
        ref={webviewRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          pointerEvents: disablePointerEvents ? 'none' : 'auto',
          // Ensure webview doesn't interfere with drag operations
          userSelect: disablePointerEvents ? 'none' : 'auto',
        }}
        nodeintegration={false}
        webpreferences="contextIsolation=true,webSecurity=false"
        allowpopups={true}
        useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        partition="persist:browser"
      />
    </div>
  );
};

export default BrowserView;