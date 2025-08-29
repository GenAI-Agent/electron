interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email?: boolean;
}

interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

interface AuthStatus {
  isAuthenticated: boolean;
  userInfo?: UserInfo;
  tokens?: AuthTokens;
}

class AuthManager {
  private static instance: AuthManager;
  private authStatus: AuthStatus = { isAuthenticated: false };
  private listeners: Array<(status: AuthStatus) => void> = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  // 檢查認證狀態
  async checkAuthStatus(): Promise<AuthStatus> {
    try {
      // 首先嘗試從 localStorage 恢復用戶信息
      const storedTokens = this.getStoredTokens();
      const storedUserInfo = this.getStoredUserInfo();
      
      // 如果有存儲的用戶信息，先設置到狀態中
      if (storedUserInfo) {
        this.authStatus = {
          isAuthenticated: true, // 假設有用戶信息就是已認證
          userInfo: storedUserInfo,
          tokens: storedTokens
        };
        console.log('Restored user info from localStorage:', storedUserInfo.name);
      }

      // 然後檢查 Electron 端的認證狀態
      if (!window.electronAPI?.oauth) {
        console.warn('OAuth API not available, using stored auth status');
        this.notifyListeners();
        return this.authStatus;
      }

      const result = await window.electronAPI.oauth.getAuthStatus();
      
      if (result.success && result.isAuthenticated) {
        // 如果 Electron 端確認已認證
        if (storedUserInfo) {
          // 如果有本地用戶信息，使用它
          this.authStatus = {
            isAuthenticated: true,
            userInfo: storedUserInfo,
            tokens: storedTokens
          };
          console.log('Using stored user info for authenticated session');
        } else if (storedTokens?.access_token) {
          // 如果沒有用戶信息但有 token，嘗試重新獲取
          try {
            console.log('No stored user info, attempting to fetch from API...');
            const userInfoResult = await window.electronAPI.oauth.getUserInfo(storedTokens.access_token);
            if (userInfoResult.success) {
              this.storeUserInfo(userInfoResult.userInfo);
              this.authStatus = {
                isAuthenticated: true,
                userInfo: userInfoResult.userInfo,
                tokens: storedTokens
              };
              console.log('Successfully fetched user info from API:', userInfoResult.userInfo.name);
            } else {
              // 無法獲取用戶信息，清除認證狀態
              console.warn('Failed to fetch user info, clearing auth status');
              localStorage.removeItem('auth_tokens');
              localStorage.removeItem('user_info');
              this.authStatus = { isAuthenticated: false };
            }
          } catch (error) {
            console.warn('Failed to refresh user info:', error);
            // 清除認證狀態
            localStorage.removeItem('auth_tokens');
            localStorage.removeItem('user_info');
            this.authStatus = { isAuthenticated: false };
          }
        } else {
          // Electron 說已認證但沒有本地數據，這是不一致的狀態
          console.warn('Electron says authenticated but no local data, clearing all');
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('user_info');
          // 嘗試清除 Electron cookies
          try {
            if (window.electronAPI.oauth.clearCookies) {
              await window.electronAPI.oauth.clearCookies('.google.com');
            }
          } catch (err) {
            console.warn('Failed to clear cookies:', err);
          }
          this.authStatus = { isAuthenticated: false };
        }
      } else {
        // 如果 Electron 端顯示未認證，清除本地存儲
        if (storedUserInfo || storedTokens) {
          console.log('Electron auth status is false, clearing stored data');
          localStorage.removeItem('auth_tokens');
          localStorage.removeItem('user_info');
        }
        this.authStatus = { isAuthenticated: false };
      }

      this.notifyListeners();
      return this.authStatus;
    } catch (error) {
      console.error('Failed to check auth status:', error);
      // 如果有網路錯誤等，保持本地的認證狀態
      if (!this.authStatus.userInfo) {
        this.authStatus = { isAuthenticated: false };
      }
      this.notifyListeners();
      return this.authStatus;
    }
  }

  // 開始 OAuth 流程
  async startOAuthFlow(): Promise<boolean> {
    try {
      if (!window.electronAPI?.oauth) {
        console.error('OAuth API not available');
        return false;
      }

      // Google OAuth 設定
      const config = {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '你的Google Client ID',
        scope: 'openid email profile'
      };

      // 開始 OAuth 流程
      const flowResult = await window.electronAPI.oauth.startFlow(config);
      
      if (!flowResult.success) {
        console.error('OAuth flow failed:', flowResult.error);
        return false;
      }

      // 交換授權碼為 token
      const tokenResult = await window.electronAPI.oauth.exchangeToken({
        clientId: config.clientId,
        clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || '你的Google Client Secret',
        code: flowResult.code
      });

      if (!tokenResult.success) {
        console.error('Token exchange failed:', tokenResult.error);
        return false;
      }

      // 獲取用戶信息
      const userInfoResult = await window.electronAPI.oauth.getUserInfo(tokenResult.tokens.access_token);
      
      if (userInfoResult.success) {
        // 存儲用戶信息和 tokens
        this.storeTokens(tokenResult.tokens);
        this.storeUserInfo(userInfoResult.userInfo);
        
        this.authStatus = {
          isAuthenticated: true,
          userInfo: userInfoResult.userInfo,
          tokens: tokenResult.tokens
        };

        this.notifyListeners();
        return true;
      } else {
        console.error('Failed to get user info:', userInfoResult.error);
        return false;
      }
    } catch (error) {
      console.error('OAuth flow error:', error);
      return false;
    }
  }

  // 登出
  async logout(): Promise<void> {
    try {
      console.log('Starting logout process...');
      
      // 清除本地存儲
      localStorage.removeItem('auth_tokens');
      localStorage.removeItem('user_info');
      console.log('Cleared localStorage');
      
      // 清除 Electron session cookies
      if (window.electronAPI?.oauth) {
        try {
          // 停止 OAuth 流程
          await window.electronAPI.oauth.stopFlow();
          console.log('Stopped OAuth flow');
          
          // 清除所有 Google 相關的 cookies
          if (window.electronAPI.oauth.clearCookies) {
            await window.electronAPI.oauth.clearCookies('.google.com');
            console.log('Cleared Google cookies');
          }
        } catch (error) {
          console.warn('Failed to clear Electron session:', error);
        }
      }

      this.authStatus = { isAuthenticated: false };
      this.notifyListeners();
      console.log('Logout completed');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  // 獲取當前認證狀態
  getCurrentAuthStatus(): AuthStatus {
    return this.authStatus;
  }

  // 監聽認證狀態變化
  onAuthStatusChange(callback: (status: AuthStatus) => void): () => void {
    this.listeners.push(callback);
    
    // 返回取消監聽的函數
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // 私有方法
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.authStatus));
  }

  private storeTokens(tokens: AuthTokens): void {
    localStorage.setItem('auth_tokens', JSON.stringify(tokens));
  }

  private getStoredTokens(): AuthTokens | null {
    try {
      const stored = localStorage.getItem('auth_tokens');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private storeUserInfo(userInfo: UserInfo): void {
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }

  private getStoredUserInfo(): UserInfo | null {
    try {
      const stored = localStorage.getItem('user_info');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}

// 擴展 window 類型以包含 electronAPI
declare global {
  interface Window {
    electronAPI?: {
      oauth?: {
        startFlow: (config: any) => Promise<any>;
        exchangeToken: (config: any) => Promise<any>;
        refreshToken: (config: any) => Promise<any>;
        stopFlow: () => Promise<any>;
        getUserInfo: (accessToken: string) => Promise<any>;
        getAuthStatus: () => Promise<any>;
        clearCookies: (domain: string) => Promise<any>;
      };
    };
  }
}

export default AuthManager;
export type { AuthStatus, UserInfo, AuthTokens };