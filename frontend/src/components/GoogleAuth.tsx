/**
 * Google OAuth 認證組件
 * 使用桌面 OAuth 2.0 流程進行 Google 登入授權
 */

import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import { useRouter } from 'next/router';

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
    <Card sx={{ maxWidth: 600, margin: 'auto', mt: 4 }}>
      <CardContent>
        <Typography variant="h5" component="h2" gutterBottom>
          Google OAuth 登入
        </Typography>

        <Typography variant="body2" color="text.secondary" paragraph>
          使用 OAuth 2.0 + PKCE 進行安全的 Google 帳戶登入
        </Typography>

        {isAuthenticating && (
          <Box sx={{ mb: 3 }}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {authResult && (
          <Alert 
            severity={authResult.success ? 'success' : 'error'} 
            sx={{ mb: 2 }}
          >
            {authResult.success ? (
              <div>
                <Typography variant="subtitle2">認證成功！瀏覽器登入狀態已設置</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  ✅ Google 登入狀態已複製到瀏覽器
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold', color: 'success.main' }}>
                  現在可以點擊「前往 Google 」來進入登入狀態！
                </Typography>
              </div>
            ) : (
              <Typography variant="body2">
                錯誤: {authResult.error}
              </Typography>
            )}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleStartAuth}
            disabled={isAuthenticating}
            startIcon={isAuthenticating ? <CircularProgress size={20} /> : null}
          >
            {isAuthenticating ? '登入中...' : '開始 Google 登入'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => router.push('/')}
            disabled={isAuthenticating}
          >
            返回首頁
          </Button>

          {authResult?.success && (
            <Button
              variant="contained"
              color="success"
              onClick={handleNavigateToGoogle}
              sx={{ mr: 1 }}
            >
              前往 Google (已登入)
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default GoogleAuth;
