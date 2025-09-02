"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, ChevronUp, Mail, Clock, User, Tag, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
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
  importance?: 'high' | 'medium' | 'low';
  category?: string;
  actionItems?: string[];
  summary?: string;
  from?: string;
  date?: Date;
}

interface SummaryPanelProps {
  summary: EmailSummary
  className?: string
}

export function SummaryPanel({ summary, className }: SummaryPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showSources, setShowSources] = useState(false)

  const getImportanceColor = (importance?: string) => {
    switch (importance) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getImportanceIcon = (importance?: string) => {
    switch (importance) {
      case 'high':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <Mail className="w-3 h-3" />
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 leading-tight">
              {summary.subject}
            </h3>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span className="truncate">{summary.from}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{new Date(summary.date || new Date()).toLocaleDateString('zh-TW')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {summary.importance && (
              <Badge
                variant="outline"
                className={cn("text-xs", getImportanceColor(summary.importance))}
              >
                {getImportanceIcon(summary.importance)}
                <span className="ml-1 capitalize">{summary.importance}</span>
              </Badge>
            )}

            {summary.category && (
              <Badge variant="secondary" className="text-xs">
                <Tag className="w-3 h-3 mr-1" />
                {summary.category}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* 摘要內容 */}
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">📋 摘要</h4>
            <p className="text-gray-700 leading-relaxed">
              {summary.summary}
            </p>
          </div>

          {/* 行動項目 */}
          {summary.actionItems && summary.actionItems.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">✅ 行動項目</h4>
              <ul className="space-y-2">
                {summary.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-gray-700">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 展開/收起按鈕 */}
          <div className="flex justify-between items-center pt-2 border-t border-gray-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSources(!showSources)}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Mail className="w-4 h-4 mr-1" />
              查看來源郵件
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? (
                <>
                  收起 <ChevronUp className="w-4 h-4 ml-1" />
                </>
              ) : (
                <>
                  展開詳情 <ChevronDown className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>

          {/* 來源郵件區塊 */}
          <AnimatePresence>
            {showSources && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-100 pt-4"
              >
                <h4 className="font-medium text-gray-900 mb-3">📧 來源郵件</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">郵件 ID: {summary.id}</span>
                    <Button variant="outline" size="sm">
                      開啟完整郵件
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p><strong>主旨:</strong> {summary.subject}</p>
                    <p><strong>寄件者:</strong> {summary.from}</p>
                    <p><strong>日期:</strong> {new Date(summary.date || new Date()).toLocaleString('zh-TW')}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 詳細資訊區塊 */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="border-t border-gray-100 pt-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">重要程度:</span>
                    <span className="ml-2 text-gray-600 capitalize">{summary.importance || '普通'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">分類:</span>
                    <span className="ml-2 text-gray-600">{summary.category || '未分類'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-900">摘要產生時間:</span>
                    <span className="ml-2 text-gray-600">{new Date().toLocaleString('zh-TW')}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}