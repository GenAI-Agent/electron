"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { EmailSummaryDisplay } from './email-summary-display'
import { EmailLabelsDisplay } from './email-labels-display'
import { AttachmentsDisplay } from './attachments-display'
import { 
  Clock, 
  Paperclip, 
  Star, 
  Archive, 
  Trash2, 
  MoreHorizontal, 
  Mail, 
  MailOpen,
  AlertCircle,
  Users,
  Bot,
  Tag
} from 'lucide-react'
import { cn } from '@/utils/cn'
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
import { format, isToday, isYesterday, isThisWeek, isThisYear } from 'date-fns'
import { zhTW } from 'date-fns/locale'

interface EmailCardProps {
  email: EmailMessage
  variant?: 'compact' | 'detailed'
  isSelected?: boolean
  onSelect?: (email: EmailMessage) => void
  emailSummary?: EmailSummary
  emailLabels?: EmailLabel[]
  showExtendedInfo?: boolean
  className?: string
}

export function EmailCard({ 
  email, 
  variant = 'compact', 
  isSelected = false, 
  onSelect,
  emailSummary,
  emailLabels,
  showExtendedInfo = false,
  className 
}: EmailCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    
    if (isToday(date)) {
      return format(date, 'HH:mm', { locale: zhTW })
    } else if (isYesterday(date)) {
      return '昨天'
    } else if (isThisWeek(date)) {
      return format(date, 'EEEE', { locale: zhTW })
    } else if (isThisYear(date)) {
      return format(date, 'M/d', { locale: zhTW })
    } else {
      return format(date, 'yyyy/M/d', { locale: zhTW })
    }
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 10) / 10} ${sizes[i]}`
  }

  const getDisplayName = () => {
    return email.fromName || email.from.split('@')[0] || email.from
  }

  const getImportanceColor = () => {
    if (email.isImportant) return 'text-yellow-500'
    return 'text-gray-400'
  }

  if (variant === 'compact') {
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 group",
          isSelected ? "ring-2 ring-blue-500 border-l-blue-500" : "border-l-transparent hover:border-l-blue-200",
          !email.isRead ? "bg-white" : "bg-gray-50/50",
          className
        )}
        onClick={() => onSelect?.(email)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center justify-center">
                {!email.isRead ? (
                  <Mail className="w-4 h-4 text-blue-600" />
                ) : (
                  <MailOpen className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <Avatar className="w-10 h-10">
                <AvatarFallback className={cn(
                  "text-sm font-medium",
                  !email.isRead ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                )}>
                  {getInitials(getDisplayName())}
                </AvatarFallback>
              </Avatar>
            </div>
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* 頂部信息行 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <p className={cn(
                    "text-sm truncate",
                    !email.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700"
                  )}>
                    {getDisplayName()}
                  </p>
                  {email.isImportant && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatDate(email.timestamp.toISOString())}
                </div>
              </div>
              
              {/* 主旨 */}
              <p className={cn(
                "text-sm truncate",
                !email.isRead ? "font-medium text-gray-900" : "text-gray-700"
              )}>
                {email.subject || '(無主旨)'}
              </p>
              
              {/* 內容預覽 */}
              <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                {email.preview || email.body?.substring(0, 120) + '...' || '(無內容)'}
              </p>
              
              {/* 底部標籤和圖示 */}
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  {email.hasAttachments && (
                    <div className="flex items-center gap-1 text-gray-400">
                      <Paperclip className="w-3 h-3" />
                      {email.attachmentCount && (
                        <span className="text-xs">{email.attachmentCount}</span>
                      )}
                    </div>
                  )}
                  {!email.isRead && (
                    <Badge variant="default" className="text-xs px-2 py-0 bg-blue-600">
                      未讀
                    </Badge>
                  )}
                  {emailSummary && (
                    <Badge variant="outline" className="text-xs px-1 py-0 flex items-center gap-1">
                      <Bot className="w-2 h-2" />
                      AI分析
                    </Badge>
                  )}
                  {emailLabels && emailLabels.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-500">{emailLabels.length}</span>
                    </div>
                  )}
                  {email.labels?.filter(label => !['UNREAD', 'IMPORTANT', 'STARRED', 'HAS_ATTACHMENT'].includes(label.name)).map((label) => (
                    <Badge key={label.id} variant="outline" className="text-xs px-1 py-0">
                      {label.name}
                    </Badge>
                  ))}
                </div>
                
                {/* 操作按鈕（hover 時顯示） */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <Archive className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg group",
        isSelected ? "ring-2 ring-blue-500" : "",
        !email.isRead ? "bg-white" : "bg-gray-50/30",
        className
      )}
      onClick={() => onSelect?.(email)}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 頂部資訊 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarFallback className={cn(
                  "text-sm font-medium",
                  !email.isRead ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                )}>
                  {getInitials(getDisplayName())}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium",
                    !email.isRead ? "text-gray-900" : "text-gray-700"
                  )}>
                    {getDisplayName()}
                  </p>
                  {email.isImportant && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  )}
                  {!email.isRead && (
                    <Badge variant="default" className="text-xs px-2 py-0 bg-blue-600">
                      未讀
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    收件者: {email.recipients?.join(', ')}
                  </span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right text-sm text-gray-500">
                <p>{formatDate(email.timestamp.toISOString())}</p>
                <div className="flex items-center gap-2 mt-1">
                  {email.hasAttachments && (
                    <div className="flex items-center gap-1">
                      <Paperclip className="w-4 h-4 text-gray-400" />
                      {email.attachmentCount && (
                        <span className="text-xs text-gray-500">
                          {email.attachmentCount}
                        </span>
                      )}
                    </div>
                  )}
                  {email.sizeEstimate && (
                    <span className="text-xs text-gray-400">
                      {formatFileSize(email.sizeEstimate)}
                    </span>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 主旨 */}
          <div>
            <h3 className={cn(
              "text-lg leading-tight",
              !email.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-800"
            )}>
              {email.subject || '(無主旨)'}
            </h3>
          </div>

          {/* 內容預覽 */}
          <div className="text-gray-700 leading-relaxed line-clamp-3">
            {email.preview || email.body?.substring(0, 300) + '...' || '(無內容預覽)'}
          </div>

          {/* 擴展信息區域 - 僅在 detailed 模式和 showExtendedInfo 為 true 時顯示 */}
          {showExtendedInfo && (
            <div className="space-y-4 mt-6">
              {/* AI 摘要 */}
              {emailSummary && (
                <EmailSummaryDisplay 
                  summary={emailSummary} 
                  className="border-0 bg-blue-50/30 rounded-lg"
                />
              )}
              
              {/* 標籤顯示 */}
              {emailLabels && emailLabels.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Tag className="w-4 h-4" />
                    標籤
                  </div>
                  <EmailLabelsDisplay labels={emailLabels} />
                </div>
              )}
              
              {/* 附件顯示 */}
              {email.attachments && email.attachments.length > 0 && (
                <AttachmentsDisplay 
                  attachments={email.attachments}
                  className="border-0 bg-orange-50/30 rounded-lg" 
                />
              )}
            </div>
          )}

          {/* 底部操作區 */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              {email.labels?.filter(label => !['UNREAD', 'IMPORTANT', 'STARRED', 'HAS_ATTACHMENT'].includes(label.name)).map((label) => (
                <Badge key={label.id} variant="outline" className="text-xs">
                  {label.name}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" title="封存">
                <Archive className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" title="標記重要" className={getImportanceColor()}>
                <Star className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" title="刪除" className="text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}