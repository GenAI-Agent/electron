const { ipcMain, BrowserWindow, session } = require('electron');
const OAuthUtils = require('../oauth-utils');

let oauthUtils = null;
let mainWindow = null;

function register(window) {
  mainWindow = window;

  // OAuth 2.0 handlers
  ipcMain.handle('oauth-start-flow', async (_, config) => {
    let authWindow = null;
    try {
      oauthUtils = new OAuthUtils();

      // Build authorization URL
      const authUrl = oauthUtils.buildAuthorizationUrl(config);

      // Start callback server
      const callbackPromise = oauthUtils.startCallbackServer();

      // Create a new window for OAuth instead of using system browser
      authWindow = new BrowserWindow({
        width: 500,
        height: 600,
        show: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          partition: 'oauth-session' // Use separate session for OAuth
        }
      });

      // Handle window closed event
      authWindow.on('closed', () => {
        authWindow = null;
      });

      // Load the authorization URL
      authWindow.loadURL(authUrl);

      // Wait for callback
      const { code, state } = await callbackPromise;

      // Verify state parameter
      if (state !== oauthUtils.state) {
        throw new Error('State parameter mismatch - possible CSRF attack');
      }

      // Check if window is still available before accessing cookies
      if (!authWindow || authWindow.isDestroyed()) {
        throw new Error('Auth window was closed before completing OAuth flow');
      }

      // Get cookies from auth window and copy to main window
      const cookies = await authWindow.webContents.session.cookies.get({
        domain: '.google.com'
      });

      // 詳細記錄所有獲取到的 cookies
      console.log('\n=== OAuth 認證完成，獲取到的 Cookies ===');
      console.log(`總共獲取到 ${cookies.length} 個 cookies:`);

      cookies.forEach((cookie, index) => {
        console.log(`\nCookie ${index + 1}:`);
        console.log(`  名稱: ${cookie.name}`);
        console.log(`  值: ${cookie.value.substring(0, 50)}${cookie.value.length > 50 ? '...' : ''}`);
        console.log(`  域名: ${cookie.domain}`);
        console.log(`  路徑: ${cookie.path}`);
        console.log(`  安全: ${cookie.secure}`);
        console.log(`  HttpOnly: ${cookie.httpOnly}`);
        console.log(`  過期時間: ${cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toISOString() : '會話結束'}`);
      });

      // 也獲取所有 Google 相關的 cookies (不只 .google.com)
      const allGoogleCookies = await authWindow.webContents.session.cookies.get({});
      const googleRelatedCookies = allGoogleCookies.filter(cookie =>
        cookie.domain.includes('google') ||
        cookie.domain.includes('gstatic') ||
        cookie.domain.includes('googleapis')
      );

      console.log(`\n=== 所有 Google 相關 Cookies (${googleRelatedCookies.length} 個) ===`);
      googleRelatedCookies.forEach((cookie, index) => {
        console.log(`${index + 1}. ${cookie.name} @ ${cookie.domain}`);
      });

      // Copy cookies to both main window session and browser session
      if (cookies.length > 0) {
        const browserSession = session.fromPartition('persist:browser');

        console.log('\n=== 開始複製 Cookies ===');
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const cookie of cookies) {
          try {
            // Skip problematic cookies
            if (cookie.name.startsWith('__Host-') || cookie.name.startsWith('__Secure-')) {
              console.log(`❌ Skipping secure prefix cookie: ${cookie.name}`);
              skipCount++;
              continue;
            }

            // Skip cookies with invalid domains
            if (!cookie.domain || cookie.domain === '') {
              console.log(`❌ Skipping cookie with invalid domain: ${cookie.name}`);
              skipCount++;
              continue;
            }

            // Fix domain for URL construction
            let urlDomain = cookie.domain;
            if (urlDomain.startsWith('.')) {
              urlDomain = urlDomain.substring(1); // Remove leading dot for URL
            }

            // 先嘗試複製所有 cookies，不過濾
            console.log(`🔄 嘗試複製 cookie: ${cookie.name} @ ${cookie.domain}`);

            const cookieData = {
              url: `https://${urlDomain}`,
              name: cookie.name,
              value: cookie.value,
              domain: cookie.domain, // Keep original domain format
              path: cookie.path || '/',
              secure: cookie.secure,
              httpOnly: cookie.httpOnly,
              expirationDate: cookie.expirationDate
            };

            // Copy to main window session
            if (mainWindow) {
              await mainWindow.webContents.session.cookies.set(cookieData);
            }

            // Copy to browser session (used by browser page)
            await browserSession.cookies.set(cookieData);

            console.log(`✅ Successfully copied cookie: ${cookie.name}`);
            successCount++;

          } catch (err) {
            console.warn(`❌ Failed to set cookie ${cookie.name}:`, err.message);
            errorCount++;
          }
        }

        console.log(`\n=== Cookie 複製結果 ===`);
        console.log(`✅ 成功: ${successCount}`);
        console.log(`❌ 跳過: ${skipCount}`);
        console.log(`🚫 錯誤: ${errorCount}`);
      } else {
        console.log('⚠️ 沒有獲取到任何 cookies');
      }

      // Close auth window safely
      if (authWindow && !authWindow.isDestroyed()) {
        authWindow.close();
      }

      // Stop callback server after successful completion
      if (oauthUtils) {
        oauthUtils.stopCallbackServer();
      }

      return { success: true, code, state, cookiesCopied: cookies.length };
    } catch (error) {
      console.error('OAuth flow error:', error);

      // Clean up auth window
      if (authWindow && !authWindow.isDestroyed()) {
        authWindow.close();
      }

      // Clean up OAuth utils
      if (oauthUtils) {
        oauthUtils.stopCallbackServer();
      }

      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('oauth-exchange-token', async (_, config) => {
    try {
      if (!oauthUtils) {
        throw new Error('OAuth flow not started');
      }

      const tokenResponse = await oauthUtils.exchangeCodeForToken(config);

      // Clean up
      oauthUtils = null;

      return { success: true, tokens: tokenResponse };
    } catch (error) {
      console.error('Token exchange error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('oauth-refresh-token', async (_, config) => {
    try {
      const tempOAuth = new OAuthUtils();
      const tokenResponse = await tempOAuth.refreshAccessToken(config);

      return { success: true, tokens: tokenResponse };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('oauth-stop-flow', async () => {
    try {
      if (oauthUtils) {
        oauthUtils.stopCallbackServer();
        oauthUtils = null;
      }
      return { success: true };
    } catch (error) {
      console.error('OAuth stop error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };