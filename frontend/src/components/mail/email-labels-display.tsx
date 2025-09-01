"use client"

import { Badge } from '@/components/ui/badge'
import { Tag, Mail, Bot } from 'lucide-react'
import { cn } from '@/utils/cn'

interface EmailLabel {
  id: string;
  name: string;
  color: string;
  type?: 'gmail' | 'ai' | 'custom';
}

interface EmailLabelsDisplayProps {
  labels: EmailLabel[]
  className?: string
}

export function EmailLabelsDisplay({ labels, className }: EmailLabelsDisplayProps) {
  if (!labels || labels.length === 0) {
    return null
  }

  const getTypeIcon = (type: EmailLabel['type']) => {
    switch (type) {
      case 'gmail':
        return <Mail className="w-3 h-3" />
      case 'ai':
        return <Bot className="w-3 h-3" />
      case 'custom':
        return <Tag className="w-3 h-3" />
      default:
        return <Tag className="w-3 h-3" />
    }
  }

  const getTypeColor = (type: EmailLabel['type']) => {
    switch (type) {
      case 'gmail':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'ai':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'custom':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {labels.map((label) => (
        <Badge
          key={label.id}
          variant="outline"
          className={cn(
            "text-xs flex items-center gap-1 px-2 py-1",
            getTypeColor(label.type)
          )}
          style={label.color ? { borderColor: label.color, color: label.color } : undefined}
        >
          {getTypeIcon(label.type)}
          {label.name}
        </Badge>
      ))}
    </div>
  )
}