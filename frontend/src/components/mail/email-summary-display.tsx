"use client"

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmailSummary {
  id: string;
  subject: string;
  sender: string;
  preview: string;
  timestamp: Date;
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  labels: any[];
  importance?: 'high' | 'medium' | 'low';
  category?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  actionRequired?: boolean;
  summary?: string;
  actionItems?: string[];
  structuredData?: any;
  project?: string;
  deadline?: string;
  amount?: string;
  location?: string;
  isInternal?: boolean;
  isExternal?: boolean;
}

interface EmailSummaryDisplayProps {
  summary: EmailSummary
  className?: string
}

export function EmailSummaryDisplay({ summary, className }: EmailSummaryDisplayProps) {
  const getImportanceIcon = () => {
    switch (summary.importance) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      case 'medium':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'low':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getImportanceColor = () => {
    switch (summary.importance) {
      case 'high':
        return 'border-red-200 bg-red-50'
      case 'medium':
        return 'border-yellow-200 bg-yellow-50'
      case 'low':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  return (
    <Card className={cn("border-l-4", getImportanceColor(), className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {getImportanceIcon()}
            AI 摘要分析
          </CardTitle>
          <div className="flex items-center gap-2">
            {summary.importance && (
              <Badge variant="outline" className="text-xs">
                {summary.importance === 'high' ? '高' : 
                 summary.importance === 'medium' ? '中' : '低'} 重要性
              </Badge>
            )}
            {summary.category && (
              <Badge variant="secondary" className="text-xs">
                {summary.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* 摘要內容 */}
        <div className="text-sm text-gray-700 leading-relaxed">
          {summary.summary}
        </div>

        {/* 行動項目 */}
        {summary.actionItems && summary.actionItems.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
              <Target className="w-3 h-3" />
              行動項目
            </div>
            <ul className="space-y-1 text-xs text-gray-600">
              {summary.actionItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="w-1 h-1 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 結構化資料 */}
        {summary.structuredData && Object.keys(summary.structuredData).length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3 text-xs">
              {summary.project && (
                <div>
                  <span className="font-medium text-gray-500">專案:</span>
                  <span className="ml-2 text-gray-700">{summary.project}</span>
                </div>
              )}
              <div>
                <span className="font-medium text-gray-500">類型:</span>
                <span className="ml-2 text-gray-700">
                  {summary.isInternal ? '內部' : summary.isExternal ? '外部' : '未分類'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}