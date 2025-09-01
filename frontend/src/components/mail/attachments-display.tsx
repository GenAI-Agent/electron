"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Paperclip, 
  FileText, 
  Image, 
  Archive, 
  Music, 
  Video, 
  File, 
  Download,
  Eye,
  Search
} from 'lucide-react'
import { cn } from '@/utils/cn'
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
  url?: string;
}

interface AttachmentsDisplayProps {
  attachments: Attachment[]
  className?: string
}

export function AttachmentsDisplay({ attachments, className }: AttachmentsDisplayProps) {
  if (!attachments || attachments.length === 0) {
    return null
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />
    } else if (mimeType.startsWith('video/')) {
      return <Video className="w-4 h-4 text-purple-500" />
    } else if (mimeType.startsWith('audio/')) {
      return <Music className="w-4 h-4 text-green-500" />
    } else if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) {
      return <FileText className="w-4 h-4 text-red-500" />
    } else if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) {
      return <Archive className="w-4 h-4 text-orange-500" />
    } else {
      return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 10) / 10} ${sizes[i]}`
  }

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase() || ''
  }

  return (
    <Card className={cn("border-l-4 border-l-orange-200 bg-orange-50/30", className)}>
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Paperclip className="w-4 h-4" />
            附件 ({attachments.length})
          </div>
          
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.mimeType)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.filename}
                      </p>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        {getFileExtension(attachment.filename).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </p>
                      {attachment.isIndexed && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          已索引
                        </Badge>
                      )}
                      {attachment.shouldIndex && !attachment.isIndexed && (
                        <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                          待索引
                        </Badge>
                      )}
                    </div>
                    
                    {/* 內容摘要 */}
                    {attachment.contentSummary && (
                      <p className="text-xs text-gray-600 mt-2 line-clamp-2">
                        {attachment.contentSummary}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                  {attachment.isIndexed && (
                    <Button variant="ghost" size="sm" title="搜尋內容">
                      <Search className="w-4 h-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" title="預覽">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="下載">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}