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
      // 檢查是否在瀏覽器環境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        console.log('⚠️ localStorage不可用（服務器端渲染）');
        return;
      }

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
      // 檢查是否在瀏覽器環境中
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }

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
   * 設置多檔案上下文（用於多檔案分析）
   */
  setMultiFileContext(context: {
    files: Array<{
      source: string;
      date: string;
      time: string;
      filename: string;
      data: any[];
    }>;
    totalFiles: number;
  }): void {
    this.currentFile = 'multi_file_context';
    this.mode = 'local';

    // 構建多檔案摘要
    const summary: FileSummary = {
      file_info: {
        path: 'multi_file_context',
        type: 'data',
        size: JSON.stringify(context.files).length,
        lines: context.files.reduce((sum, file) => sum + file.data.length, 0),
        encoding: 'utf-8'
      },
      segments: context.files.map((file, index) => ({
        start_line: index * 1000 + 1,
        end_line: (index + 1) * 1000,
        summary: `${file.source} 資料集 (${file.date} ${file.time}) - ${file.data.length} 筆資料`,
        keywords: Object.keys(file.data[0] || {}),
        content_type: file.source
      })),
      data_schema: {
        columns: ['source', 'date', 'time', 'filename', 'data'],
        types: ['string', 'string', 'string', 'string', 'array'],
        sample_data: context.files, // 直接保存檔案資訊
        row_count: context.totalFiles
      },
      generated_at: new Date().toISOString()
    };

    this.fileSummary = summary;
    this.saveToStorage();
  }

  /**
   * 設置文件上下文（用於沙盒等場景）
   */
  setFileContext(context: {
    filePath: string;
    fileName: string;
    fileType: string;
    content: any[];
  }): void {
    this.currentFile = context.filePath;
    this.mode = 'local';

    // 處理單一資料集的情況
    let summary: FileSummary;

    // 單一資料集的情況
    summary = {
      file_info: {
        path: context.filePath,
        type: 'data',
        size: JSON.stringify(context.content).length,
        lines: context.content.length,
        encoding: 'utf-8'
      },
      segments: [{
        start_line: 1,
        end_line: context.content.length,
        summary: `${context.fileName} 包含 ${context.content.length} 筆資料`,
        keywords: Object.keys(context.content[0] || {}),
        content_type: context.fileType
      }],
      data_schema: {
        columns: Object.keys(context.content[0] || {}),
        types: Object.keys(context.content[0] || {}).map(() => 'string'),
        sample_data: context.content.slice(0, 5),
        row_count: context.content.length
      },
      generated_at: new Date().toISOString()
    };

    this.fileSummary = summary;
    this.saveToStorage();
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
