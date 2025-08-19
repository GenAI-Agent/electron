/**
 * Session Manager - 管理用戶會話和文件上下文
 */

export interface FileSummary {
  file_info: {
    path: string;
    type: 'text' | 'data';
    size: number;
    lines?: number;
    encoding?: string;
  };
  segments: Array<{
    start_line: number;
    end_line: number;
    summary: string;
    keywords: string[];
    content_type: string;
  }>;
  data_schema?: {
    columns: string[];
    types: string[];
    sample_data: any[];
    row_count: number;
  };
  generated_at: string;
}

export interface FileContext {
  current_file: string | null;
  file_summary: FileSummary | null;
  mode: 'local' | 'browser';
}

export class SessionManager {
  private sessionId: string;
  private currentFile: string | null = null;
  private fileSummary: FileSummary | null = null;
  private mode: 'local' | 'browser' = 'browser';

  constructor() {
    // 每次創建SessionManager都生成新的session_id
    this.sessionId = this.generateSessionId();
    this.loadFromStorage();
    console.log(`🆕 新的Session已創建: ${this.sessionId}`);
  }

  /**
   * 生成唯一的 Session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `session_${timestamp}_${random}`;
  }

  /**
   * 從 localStorage 加載會話數據
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('current_session');
      if (stored) {
        const data = JSON.parse(stored);

        // 每次應用啟動都使用新的session_id，但保留文件上下文
        console.log('📁 從儲存中恢復文件上下文');

        // 保留文件上下文和模式
        this.currentFile = data.currentFile || null;
        this.fileSummary = data.fileSummary || null;
        this.mode = data.mode || 'browser';
      }

      // 保存新的session數據
      this.saveToStorage();

    } catch (error) {
      console.warn('Failed to load session from storage:', error);
    }
  }

  /**
   * 保存會話數據到 localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        sessionId: this.sessionId,
        currentFile: this.currentFile,
        fileSummary: this.fileSummary,
        mode: this.mode,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('current_session', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save session to storage:', error);
    }
  }

  /**
   * 獲取當前 Session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * 創建新的會話
   */
  createNewSession(): string {
    this.sessionId = this.generateSessionId();
    this.currentFile = null;
    this.fileSummary = null;
    this.mode = 'browser';
    this.saveToStorage();
    return this.sessionId;
  }

  /**
   * 強制刷新session_id（用於手動刷新）
   */
  forceRefreshSession(): string {
    const oldSessionId = this.sessionId;
    this.sessionId = this.generateSessionId();
    this.saveToStorage();
    console.log(`🔄 強制刷新session: ${oldSessionId} → ${this.sessionId}`);
    return this.sessionId;
  }

  /**
   * 設置當前模式
   */
  setMode(mode: 'local' | 'browser'): void {
    this.mode = mode;
    if (mode === 'browser') {
      this.currentFile = null;
      this.fileSummary = null;
    }
    this.saveToStorage();
  }

  /**
   * 獲取當前模式
   */
  getMode(): 'local' | 'browser' {
    return this.mode;
  }

  /**
   * 設置當前文件
   */
  setCurrentFile(filePath: string): void {
    this.currentFile = filePath;
    this.mode = 'local';
    // 清除舊的文件摘要，等待新的摘要生成
    this.fileSummary = null;
    this.saveToStorage();
  }

  /**
   * 獲取當前文件路徑
   */
  getCurrentFile(): string | null {
    return this.currentFile;
  }

  /**
   * 更新文件摘要
   */
  updateFileSummary(summary: FileSummary): void {
    this.fileSummary = summary;
    this.saveToStorage();
  }

  /**
   * 獲取文件摘要
   */
  getFileSummary(): FileSummary | null {
    return this.fileSummary;
  }

  /**
   * 獲取當前文件上下文
   */
  getCurrentContext(): FileContext {
    return {
      current_file: this.currentFile,
      file_summary: this.fileSummary,
      mode: this.mode
    };
  }

  /**
   * 檢查是否有有效的文件上下文
   */
  hasFileContext(): boolean {
    return this.mode === 'local' && this.currentFile !== null;
  }

  /**
   * 清除當前文件上下文
   */
  clearFileContext(): void {
    this.currentFile = null;
    this.fileSummary = null;
    this.saveToStorage();
  }

  /**
   * 獲取用於 API 請求的上下文數據
   */
  getApiContext(): any {
    const context: any = {
      session_id: this.sessionId,
      mode: this.mode
    };

    if (this.hasFileContext()) {
      context.file_context = {
        file_path: this.currentFile,
        file_summary: this.fileSummary
      };
    }

    return context;
  }

  /**
   * 重置會話（保留 Session ID）
   */
  resetSession(): void {
    this.currentFile = null;
    this.fileSummary = null;
    this.mode = 'browser';
    this.saveToStorage();
  }
}

// 全局 Session Manager 實例
export const sessionManager = new SessionManager();

// 導出便利函數
export const getSessionId = () => sessionManager.getSessionId();
export const getCurrentFileContext = () => sessionManager.getCurrentContext();
export const hasFileContext = () => sessionManager.hasFileContext();
