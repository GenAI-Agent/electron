declare global {
  interface Window {
    electronAPI: {
      navigateToUrl: (
        url: string
      ) => Promise<{ success: boolean; url: string }>;
      getBrowserState: () => Promise<{
        currentUrl: string;
        canGoBack: boolean;
        canGoForward: boolean;
      }>;
      navigateToGoogle: () => Promise<{ success: boolean; error?: string }>;
      closeWindow: () => Promise<void>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;

      // File system APIs
      getDesktopPath: () => Promise<string>;
      getDocumentsPath: () => Promise<string>;
      readDirectory: (dirPath: string) => Promise<{
        success: boolean;
        items?: Array<{
          name: string;
          isDirectory: boolean;
          isFile: boolean;
          path: string;
        }>;
        error?: string;
      }>;
      openFile: (
        filePath: string
      ) => Promise<{ success: boolean; error?: string }>;
      getFileStats: (filePath: string) => Promise<{
        success: boolean;
        stats?: {
          isDirectory: boolean;
          isFile: boolean;
          size: number;
          modified: Date;
          created: Date;
        };
        error?: string;
      }>;
      readFile: (filePath: string) => Promise<{
        type: "text" | "pdf" | "binary" | "presentation";
        content?: string;
        filePath?: string;
        size?: number;
        extension?: string;
      }>;
      readFileBase64: (filePath: string) => Promise<{
        success: boolean;
        data?: string;
        mimeType?: string;
        size?: number;
        error?: string;
      }>;

      // Extended file operations
      writeFile: (
        filePath: string,
        content: string,
        encoding?: string
      ) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      createFile: (
        filePath: string,
        content?: string,
        encoding?: string
      ) => Promise<{
        success: boolean;
        message?: string;
        path?: string;
        error?: string;
      }>;
      deleteFile: (filePath: string) => Promise<{
        success: boolean;
        message?: string;
        error?: string;
      }>;
      editFileLines: (
        filePath: string,
        startLine: number,
        endLine: number,
        newContent: string
      ) => Promise<{
        success: boolean;
        message?: string;
        linesChanged?: number;
        newLineCount?: number;
        error?: string;
      }>;
      oauth: {
        startFlow: (config: {
          clientId: string;
          clientSecret: string;
          scope: string;
        }) => Promise<{
          success: boolean;
          code?: string;
          state?: string;
          error?: string;
        }>;
        exchangeToken: (config: {
          clientId: string;
          clientSecret: string;
          code: string;
        }) => Promise<{
          success: boolean;
          tokens?: {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
            token_type: string;
          };
          error?: string;
        }>;
        refreshToken: (config: {
          clientId: string;
          clientSecret: string;
          refreshToken: string;
        }) => Promise<{
          success: boolean;
          tokens?: {
            access_token: string;
            refresh_token?: string;
            expires_in: number;
            token_type: string;
          };
          error?: string;
        }>;
        stopFlow: () => Promise<{ success: boolean; error?: string }>;
        syncGoogleCookies: (tokens: {
          access_token: string;
          refresh_token?: string;
          expires_in?: number;
          token_type?: string;
        }) => Promise<{ 
          success: boolean; 
          userInfo?: {
            email: string;
            name?: string;
            id?: string;
          };
          message?: string;
          warning?: string;
          error?: string; 
        }>;
        injectGoogleAuth: (authData: {
          access_token: string;
          user_info: {
            email: string;
            name?: string;
            id?: string;
          };
          expires_at: number;
        }) => Promise<{
          success: boolean;
          message?: string;
          result?: any;
          error?: string;
        }>;
        injectWebviewToken: (tokenData: {
          access_token: string;
          user_info: {
            email: string;
            name?: string;
            id?: string;
          };
          expires_at: number;
        }) => Promise<{
          success: boolean;
          result?: any;
          error?: string;
        }>;
        startWebviewGoogleLogin: () => Promise<{
          success: boolean;
          url?: string;
          message?: string;
          error?: string;
        }>;
        checkWebviewLoginStatus: () => Promise<{
          success: boolean;
          status?: {
            url: string;
            hostname: string;
            isOnGmail: boolean;
            hasUserElements: boolean;
            hasAccountMenu: boolean;
            urlIndicatesLogin: boolean;
            likelyLoggedIn: boolean;
          };
          error?: string;
        }>;
        debugWebviewCookies: () => Promise<{
          success: boolean;
          cookies?: any;
          authCookies?: Array<{
            domain: string;
            name: string;
            hasValue: boolean;
          }>;
          hasGoogleAuth?: boolean;
          error?: string;
        }>;
      };

      browserControl: {
        click: (
          selector: string,
          options?: {
            button?: "left" | "right" | "middle";
            doubleClick?: boolean;
            delay?: number;
            force?: boolean;
          }
        ) => Promise<{
          success: boolean;
          error?: string;
          elementText?: string;
          elementTag?: string;
          executionTime?: number;
        }>;
        testClick: (
          selector: string,
          options?: {
            button?: "left" | "right" | "middle";
            doubleClick?: boolean;
            delay?: number;
            force?: boolean;
          }
        ) => Promise<{
          success: boolean;
          error?: string;
          elementText?: string;
          elementTag?: string;
          executionTime?: number;
        }>;

        type: (
          selector: string,
          text: string,
          options?: {
            delay?: number;
            clear?: boolean;
            pressEnter?: boolean;
          }
        ) => Promise<{
          success: boolean;
          error?: string;
          value?: string;
          executionTime?: number;
        }>;

        scroll: (
          direction: "up" | "down" | "left" | "right" | "top" | "bottom",
          amount?: number
        ) => Promise<{
          success: boolean;
          error?: string;
          position?: { x: number; y: number };
        }>;

        navigate: (
          url: string,
          options?: {
            waitUntil?: "load" | "domcontentloaded" | "networkidle";
            timeout?: number;
          }
        ) => Promise<{
          success: boolean;
          error?: string;
          url?: string;
          title?: string;
        }>;

        waitForElement: (
          selector: string,
          timeout?: number
        ) => Promise<{
          success: boolean;
          error?: string;
          found?: boolean;
          elementText?: string;
        }>;

        waitForNavigation: (timeout?: number) => Promise<{
          success: boolean;
          error?: string;
          url?: string;
          title?: string;
        }>;

        takeScreenshot: (options?: {
          format?: "png" | "jpeg";
          quality?: number;
          fullPage?: boolean;
          clip?: { x: number; y: number; width: number; height: number };
        }) => Promise<{
          success: boolean;
          error?: string;
          screenshot?: string;
          format?: string;
        }>;

        executeScript: (script: string) => Promise<{
          success: boolean;
          error?: string;
          result?: any;
        }>;

        getPageData: (options?: {
          accessToken?: string;
          refreshToken?: string;
          clientConfig?: {
            clientId: string;
            clientSecret: string;
          };
          useAPI?: boolean;
          maxResults?: number;
          labelIds?: string[];  // Gmail 標籤過濾選項
          query?: string;       // Gmail 查詢條件 (如 'category:primary')
        }) => Promise<{
          success: boolean;
          error?: string;
          pageData?: any;
        }>;
      };
    };
  }
}

export {};
