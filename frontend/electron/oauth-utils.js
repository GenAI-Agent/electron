/**
 * OAuth 2.0 with PKCE utilities for desktop applications
 * Implements RFC 8252 recommendations for native/desktop apps
 */

const crypto = require('crypto');
const http = require('http');
const { URL } = require('url');
const { shell } = require('electron');

class OAuthUtils {
  constructor() {
    this.redirectPort = 8080; // Default port, will try others if occupied
    this.redirectUri = `http://127.0.0.1:${this.redirectPort}/callback`;
    this.server = null;
    this.codeVerifier = null;
    this.codeChallenge = null;
    this.state = null;
  }

  /**
   * Generate PKCE code verifier and challenge
   * @returns {Object} Object containing codeVerifier and codeChallenge
   */
  generatePKCE() {
    // Generate code verifier (43-128 characters, URL-safe)
    this.codeVerifier = crypto.randomBytes(32).toString('base64url');

    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    this.codeChallenge = crypto
      .createHash('sha256')
      .update(this.codeVerifier)
      .digest('base64url');

    return {
      codeVerifier: this.codeVerifier,
      codeChallenge: this.codeChallenge
    };
  }

  /**
   * Generate a random state parameter for CSRF protection
   * @returns {string} Random state string
   */
  generateState() {
    this.state = crypto.randomBytes(16).toString('hex');
    return this.state;
  }

  /**
   * Build Google OAuth authorization URL
   * @param {Object} config OAuth configuration
   * @param {string} config.clientId Google OAuth client ID
   * @param {string} config.scope OAuth scopes (space-separated)
   * @returns {string} Authorization URL
   */
  buildAuthorizationUrl(config) {
    const { clientId, scope = 'openid email profile' } = config;

    // Generate PKCE parameters
    this.generatePKCE();
    const state = this.generateState();

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', this.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('code_challenge', this.codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline'); // For refresh token
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen

    return authUrl.toString();
  }

  /**
   * Start local HTTP server to receive OAuth callback
   * @returns {Promise<Object>} Promise that resolves with authorization code and state
   */
  startCallbackServer() {
    return new Promise((resolve, reject) => {
      // Try to find an available port starting from redirectPort
      this.tryStartServer(this.redirectPort, resolve, reject);
    });
  }

  /**
   * Try to start server on given port, increment if occupied
   * @param {number} port Port to try
   * @param {Function} resolve Promise resolve function
   * @param {Function} reject Promise reject function
   */
  tryStartServer(port, resolve, reject) {
    this.server = http.createServer((req, res) => {
      const url = new URL(req.url, `http://127.0.0.1:${port}`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        // Send response to browser
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <head><title>授權失敗</title></head>
              <body>
                <h1>授權失敗</h1>
                <p>錯誤: ${error}</p>
                <p>您可以關閉此視窗。</p>
              </body>
            </html>
          `);
          reject(new Error(`OAuth error: ${error}`));
        } else if (code && state) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <head><title>授權成功</title></head>
              <body>
                <h1>授權成功！</h1>
                <p>您已成功授權，可以關閉此視窗。</p>
                <script>window.close();</script>
              </body>
            </html>
          `);
          resolve({ code, state });
        } else {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(`
            <html>
              <head><title>授權失敗</title></head>
              <body>
                <h1>授權失敗</h1>
                <p>缺少必要的參數。</p>
                <p>您可以關閉此視窗。</p>
              </body>
            </html>
          `);
          reject(new Error('Missing required parameters'));
        }

        // Close server after handling request
        setTimeout(() => {
          this.stopCallbackServer();
        }, 1000);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port is in use, try next port
        this.tryStartServer(port + 1, resolve, reject);
      } else {
        reject(err);
      }
    });

    this.server.listen(port, '127.0.0.1', () => {
      this.redirectPort = port;
      this.redirectUri = `http://127.0.0.1:${port}/callback`;
      console.log(`OAuth callback server started on port ${port}`);
    });
  }

  /**
   * Stop the callback server
   */
  stopCallbackServer() {
    if (this.server) {
      this.server.close();
      this.server = null;
      console.log('OAuth callback server stopped');
    }
  }

  /**
   * Exchange authorization code for access token
   * @param {Object} config Token exchange configuration
   * @param {string} config.clientId Google OAuth client ID
   * @param {string} config.clientSecret Google OAuth client secret
   * @param {string} config.code Authorization code from callback
   * @returns {Promise<Object>} Promise that resolves with token response
   */
  async exchangeCodeForToken(config) {
    const { clientId, clientSecret, code } = config;
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code_verifier: this.codeVerifier
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token exchange failed: ${response.status} ${errorData}`);
      }

      const tokenResponse = await response.json();
      return tokenResponse;
    } catch (error) {
      console.error('Token exchange error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   * @param {Object} config Refresh configuration
   * @param {string} config.clientId Google OAuth client ID
   * @param {string} config.clientSecret Google OAuth client secret
   * @param {string} config.refreshToken Refresh token
   * @returns {Promise<Object>} Promise that resolves with new token response
   */
  async refreshAccessToken(config) {
    const { clientId, clientSecret, refreshToken } = config;

    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenData = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token'
    });

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: tokenData
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Token refresh failed: ${response.status} ${errorData}`);
      }

      const tokenResponse = await response.json();
      return tokenResponse;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Open URL in system default browser
   * @param {string} url URL to open
   */
  openInBrowser(url) {
    shell.openExternal(url);
  }
}

module.exports = OAuthUtils;
