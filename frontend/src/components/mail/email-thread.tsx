"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/utils/cn'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { format, formatDistanceToNow } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { ChevronDown, ChevronRight, Paperclip, Star, Mail, Download } from 'lucide-react'
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

interface Email extends EmailSummary {
  body: string;
  recipients: string[];
  summary: EmailSummary | null;
  cc?: string[];
  bcc?: string[];
  from: string;
  fromName?: string;
  importance?: 'high' | 'normal' | 'low';
  isImportant?: boolean;
  attachmentCount?: number;
  sizeEstimate?: number;
  attachments?: Attachment[];
}

interface Attachment {
  id: string;
  name: string;
  filename: string;
  size: number;
  type: string;
  mimeType: string;
  isIndexed?: boolean;
  shouldIndex?: boolean;
  contentSummary?: string;
  onDownload?: () => void;
  url?: string;
}

interface EmailThreadType {
  id: string;
  subject: string;
  participants: string[];
  messageCount: number;
  lastActivity: Date;
  isRead: boolean;
  isUnread: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: EmailLabel[];
  emails: Email[];
}

interface EmailThreadProps {
  thread: EmailThreadType & {
    emails: (Email & {
      attachments: (Attachment & { onDownload?: () => void })[]
      summary: EmailSummary | null
      labels: any[]
    })[]
  }
  defaultExpanded?: boolean
  enableNavigation?: boolean
}

export function EmailThread({ thread, defaultExpanded = false, enableNavigation = true }: EmailThreadProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null)

  const firstEmail = thread.emails[0]
  const lastEmail = thread.emails[thread.emails.length - 1]
  const hasAttachments = thread.emails.some(email => email.attachments && email.attachments.length > 0)

  const formatEmailDate = (date: Date) => {
    const now = new Date()
    const emailDate = new Date(date)
    const diffInHours = (now.getTime() - emailDate.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return formatDistanceToNow(emailDate, { locale: zhTW, addSuffix: true })
    } else if (diffInHours < 168) { // 7 days
      return format(emailDate, 'EEEE', { locale: zhTW })
    } else {
      return format(emailDate, 'yyyy/MM/dd', { locale: zhTW })
    }
  }

  const handleThreadClick = (e: React.MouseEvent) => {
    if (enableNavigation && !defaultExpanded) {
      e.stopPropagation()
      router.push(`/dashboard/mail/${thread.id}`)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleDownloadAttachment = async (attachmentId: string, filename: string) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/download`)

      if (!response.ok) {
        throw new Error('Failed to download attachment')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      alert('下載失敗，請稍後再試')
    }
  }

  return (
    <div className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
      {/* Thread Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={handleThreadClick}
      >
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h3 className={cn(
                  "font-medium truncate",
                  thread.isUnread && "font-semibold"
                )}>
                  {thread.subject || '(無主旨)'}
                </h3>
                {thread.messageCount > 1 && (
                  <Badge variant="secondary" className="text-xs">
                    {thread.messageCount}
                  </Badge>
                )}
                {hasAttachments && (
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className="text-sm text-muted-foreground">
                {formatEmailDate(lastEmail.timestamp)}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">
                {thread.participants.slice(0, 3).join(', ')}
                {thread.participants.length > 3 && ` 及其他 ${thread.participants.length - 3} 人`}
              </span>
            </div>

            {!isExpanded && lastEmail.preview && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {lastEmail.preview}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Thread Content */}
      {isExpanded && (
        <div className="border-t">
          {thread.emails.map((email, index) => (
            <div
              key={email.id}
              className={cn(
                "border-b last:border-b-0",
                selectedEmailId === email.id && "bg-muted/50"
              )}
            >
              {/* Email Header */}
              <div
                className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setSelectedEmailId(
                  selectedEmailId === email.id ? null : email.id
                )}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {email.fromName?.charAt(0) || email.from.charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-sm">
                          {email.fromName || email.from}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          &lt;{email.from}&gt;
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(email.timestamp), 'yyyy/MM/dd HH:mm')}
                      </span>
                    </div>

                    {selectedEmailId !== email.id && email.preview && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {email.preview}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Email Detail */}
              {selectedEmailId === email.id && (
                <div className="px-4 pb-4">
                  {/* Recipients */}
                  <div className="text-sm text-muted-foreground mb-3 ml-11">
                    <div>收件人: {email.recipients.join(', ')}</div>
                    {email.cc && email.cc.length > 0 && <div>副本: {email.cc.join(', ')}</div>}
                  </div>

                  {/* Email Summary */}
                  {email.summary && (
                    <div className="ml-11 mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-sm mb-2 text-blue-900">AI 摘要</h4>
                      <p className="text-sm text-blue-800">{JSON.stringify(email.summary)}</p>

                      {/* {email.summary.actionItems && email.summary.actionItems.length > 0 && (
                        <div className="mt-2">
                          <h5 className="font-medium text-xs text-blue-900 mb-1">待辦事項:</h5>
                          <ul className="list-disc list-inside text-xs text-blue-800">
                            {email.summary.actionItems.map((item, i) => (
                              <li key={i}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {email.summary.category && (
                        <Badge variant="outline" className="mt-2 text-xs">
                          {email.summary.category}
                        </Badge>
                      )} */}
                    </div>
                  )}

                  {/* Email Body */}
                  <div className="ml-11">
                    <div
                      className="prose prose-sm max-w-none text-sm"
                      dangerouslySetInnerHTML={{ __html: email.body || '' }}
                    />
                  </div>

                  {/* Attachments */}
                  {email.attachments && email.attachments.length > 0 && (
                    <div className="ml-11 mt-4">
                      <h4 className="font-medium text-sm mb-2">附件 ({email.attachments.length})</h4>
                      <div className="space-y-2">
                        {email.attachments.map((attachment) => (
                          <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 border rounded hover:bg-muted/50 transition-colors"
                          >
                            <Paperclip className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {attachment.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {(attachment.size / 1024).toFixed(1)} KB • {attachment.mimeType}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (attachment.onDownload) {
                                  attachment.onDownload()
                                } else {
                                  handleDownloadAttachment(attachment.id, attachment.filename)
                                }
                              }}
                              className="flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              下載
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Labels */}
                  {email.labels.length > 0 && (
                    <div className="ml-11 mt-4 flex flex-wrap gap-2">
                      {email.labels.map((label) => (
                        <Badge
                          key={label.id}
                          variant="outline"
                          className="text-xs"
                          style={{ borderColor: label.color, color: label.color }}
                        >
                          {label.name}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}