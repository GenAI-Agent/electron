export interface SearchResult {
  position: number;
  url: string;
  title: string;
  description?: string;
  source: string;
  raw_content: string | null;
}

export interface GmailMessageInfo {
  messageId: string;
  subject: string;
  attachments_count: number;
  batch?: number;
  error?: string;
}

export interface GmailZipFileInfo {
  zip_filename: string;
  s3_key: string;
  upload_status: string;
  download_url: string;
  batch_number: number;
  successful_count: number;
  failed_count: number;
}

export interface SalesAnalysisResult {
  trend_stats: {
    slope: number;
    intercept: number;
    r_squared: number;
  };
  raw_data: {
    [key: string]: number | string | Date | null;
  }[];
}
