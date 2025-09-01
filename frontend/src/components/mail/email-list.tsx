"use client"

import { useState, useEffect } from 'react'
import { EmailCard } from './email-card'
import { SummaryPanel } from './summary-panel'
import { EmailThread } from './email-thread'
// import { IndexBanner } from '@/components/indexing/index-banner'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, Search, Mail, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useRouter } from 'next/navigation'

// Define types locally
interface EmailLabel {
  id: string;
  name: string;
  color: string;
}

interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: EmailLabel[];
}

interface EmailMessage extends EmailSummary {
  body: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  from: string;
  fromName?: string;
  importance?: 'high' | 'normal' | 'low';
  isImportant?: boolean;
  attachmentCount?: number;
  sizeEstimate?: number;
  attachments?: any[];
}

interface SearchResult {
  emails: EmailMessage[];
  totalCount: number;
  query: string;
}

type ViewMode = 'list' | 'thread' | 'summary';

interface IndexStatus {
  status: 'not_indexed' | 'indexing' | 'indexed' | 'error'
  progress: number
  totalEmails: number
  processedEmails: number
  lastIndexedAt?: string
  errorMessage?: string
}

interface EmailListProps {
  searchResult: SearchResult | null
  emailThreads?: any
  viewMode: ViewMode
  isLoading?: boolean
  className?: string
  currentPage?: number
  onPageChange?: (page: number) => void
}

export function EmailList({ 
  searchResult, 
  emailThreads,
  viewMode, 
  isLoading = false,
  className,
  currentPage = 1,
  onPageChange
}: EmailListProps) {
  const [selectedEmail, setSelectedEmail] = useState<EmailMessage | null>(null)
  const [indexStatus, setIndexStatus] = useState<IndexStatus | null>(null)
  const [isLoadingIndex, setIsLoadingIndex] = useState(true)
  const itemsPerPage = 10
  const router = useRouter()

  // 獲取索引狀態
  useEffect(() => {
    const fetchIndexStatus = async () => {
      try {
        const response = await fetch('/api/mail/index_status')
        const data = await response.json()
        
        if (data.success) {
          setIndexStatus({
            status: data.status,
            progress: data.progress,
            totalEmails: data.totalEmails,
            processedEmails: data.processedEmails,
            lastIndexedAt: data.lastIndexedAt,
            errorMessage: data.errorMessage
          })
        }
      } catch (error) {
        console.error('Failed to fetch index status:', error)
      } finally {
        setIsLoadingIndex(false)
      }
    }

    fetchIndexStatus()
  }, [])

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <EmailListSkeleton />
      </div>
    )
  }

  // Determine which data to use
  const dataToDisplay = searchResult || emailThreads
  
  if (!dataToDisplay) {
    // 如果用戶尚未索引，顯示索引提示而非搜尋提示
    if (!isLoadingIndex && indexStatus && indexStatus.status !== 'indexed') {
      return (
        <div className={cn("space-y-6", className)}>
          {/* <IndexBanner /> */}
          <div className="text-center py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-2">
                  目前僅可設定規則
                </h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  建立索引前，您可以先設定 AI 處理規則。完成索引後即可使用搜尋功能。
                </p>
              </div>
              <Button 
                onClick={() => router.push('/dashboard/agents')}
                className="mt-4"
              >
                <Settings className="w-4 h-4 mr-2" />
                設定規則
              </Button>
            </div>
          </div>
        </div>
      )
    }
    
    return (
      <div className={cn("text-center py-16", className)}>
        <EmptySearchState />
      </div>
    )
  }

  // Handle empty results
  const isEmpty = searchResult
    ? searchResult.emails.length === 0
    : emailThreads?.threads?.length === 0

  if (isEmpty) {
    return (
      <div className={cn("text-center py-16", className)}>
        <NoResultsState query={searchResult?.query || ''} />
      </div>
    )
  }

  // Get results and pagination info
  const results = searchResult
    ? searchResult.emails as (EmailMessage[] | EmailSummary[])
    : emailThreads?.threads || []
  
  const totalCount = searchResult?.totalCount || emailThreads?.totalCount || 0
  const totalPages = searchResult 
    ? Math.ceil(results.length / itemsPerPage)
    : emailThreads?.totalPages || 1
  
  // For search results, we paginate the results array
  // For email threads, pagination is handled by API
  const currentResults = searchResult 
    ? results.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : results

  const handlePrevPage = () => {
    const newPage = Math.max(currentPage - 1, 1)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  const handleNextPage = () => {
    const newPage = Math.min(currentPage + 1, totalPages)
    if (onPageChange) {
      onPageChange(newPage)
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* 結果統計 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <p>
          找到 <span className="font-medium text-foreground">{totalCount}</span> 個結果
          {searchResult?.query && (
            <>
              ，搜尋關鍵字: <span className="font-medium text-foreground">&ldquo;{searchResult.query}&rdquo;</span>
            </>
          )}
        </p>
        <p>
          {searchResult ? (
            <>第 {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, results.length)} 項，共 {results.length} 項</>
          ) : (
            <>第 {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, totalCount)} 項，共 {totalCount} 項</>
          )}
        </p>
      </div>

      {/* 結果列表 */}
      <div className="space-y-4">
        {viewMode === 'summary' ? (
          // Summary 模式 - 顯示摘要面板
          (currentResults as EmailSummary[]).map((summary) => (
            <SummaryPanel
              key={summary.id}
              summary={summary}
              className="hover:shadow-md transition-shadow"
            />
          ))
        ) : (
          // Detailed 模式 - 顯示郵件threads
          emailThreads ? (
            // 如果有threads資料，顯示thread view
            (currentResults as any[]).map((thread) => (
              <EmailThread
                key={thread.id}
                thread={thread}
                defaultExpanded={false}
                enableNavigation={true}
              />
            ))
          ) : (
            // 否則顯示傳統的email列表
            (currentResults as EmailMessage[]).map((email) => (
              <EmailCard
                key={email.id}
                email={email}
                variant="detailed"
                isSelected={selectedEmail?.id === email.id}
                onSelect={setSelectedEmail}
                showExtendedInfo={true}
              />
            ))
          )
        )}
      </div>

      {/* 分頁控制 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-6">
          <Button
            variant="outline"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            上一頁
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (currentPage <= 3) {
                pageNum = i + 1
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = currentPage - 2 + i
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange ? onPageChange(pageNum) : undefined}
                  className="w-8 h-8 p-0"
                >
                  {pageNum}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="flex items-center gap-2"
          >
            下一頁
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

// 骨架載入組件
function EmailListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="border rounded-2xl p-6">
          <div className="flex items-start gap-4">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// 空狀態組件
function EmptySearchState() {
  return (
    <div className="space-y-4">
      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
        <Search className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">
          開始搜尋您的郵件
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          使用上方搜尋框輸入關鍵字或描述您想找的內容，AI 會幫您找到相關的郵件。
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        <Button variant="outline" size="sm">
          重要會議
        </Button>
        <Button variant="outline" size="sm">
          專案更新
        </Button>
        <Button variant="outline" size="sm">
          客戶回饋
        </Button>
        <Button variant="outline" size="sm">
          發票
        </Button>
      </div>
    </div>
  )
}

// 無結果狀態組件
function NoResultsState({ query }: { query: string }) {
  return (
    <div className="space-y-4">
      <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
        <Mail className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h3 className="text-lg font-medium mb-2">
          找不到相關結果
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          沒有找到與 &ldquo;<span className="font-medium">{query}</span>&rdquo; 相關的郵件。
          嘗試使用其他關鍵字或調整搜尋條件。
        </p>
      </div>
      <div className="space-y-2 text-sm text-muted-foreground">
        <p>搜尋建議：</p>
        <ul className="text-left max-w-md mx-auto space-y-1">
          <li>• 檢查拼字是否正確</li>
          <li>• 嘗試使用不同的關鍵字</li>
          <li>• 使用更簡單或更具體的詞彙</li>
          <li>• 調整時間範圍或其他篩選條件</li>
        </ul>
      </div>
    </div>
  )
}