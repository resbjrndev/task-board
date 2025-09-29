'use client'

import { useState } from 'react'
import { Calendar, MessageCircle, Paperclip, User } from 'lucide-react'
import { cn } from '@/utils/cn'
import { formatDate, isOverdue } from '@/utils/date'
import type { Task } from '@/types/board'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const hasAttachments = task.attachments.length > 0
  const hasComments = task.comments.length > 0
  const hasDueDate = !!task.dueDate
  const isTaskOverdue = hasDueDate && isOverdue(task.dueDate!)

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500'
      case 'medium':
        return 'bg-orange-500'
      case 'low':
        return 'bg-green-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg p-3 shadow-sm border border-gray-200 dark:border-gray-700",
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isHovered && "scale-[1.02]"
      )}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Priority indicator */}
      <div className={cn("w-full h-1 rounded-full mb-3", getPriorityColor(task.priority))} />

      {/* Task title */}
      <h4 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {/* Labels */}
      {task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.labels.map((label) => (
            <span
              key={label.id}
              className={cn(
                "px-2 py-1 text-xs rounded-full text-white",
                `bg-${label.color}-500`
              )}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      {/* Due date */}
      {hasDueDate && (
        <div className={cn(
          "flex items-center space-x-1 mb-2 text-xs",
          isTaskOverdue ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-gray-400"
        )}>
          <Calendar className="w-3 h-3" />
          <span>{formatDate(task.dueDate!)}</span>
        </div>
      )}

      {/* Footer with metadata */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {hasAttachments && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <Paperclip className="w-3 h-3" />
              <span>{task.attachments.length}</span>
            </div>
          )}

          {hasComments && (
            <div className="flex items-center space-x-1 text-xs text-gray-600 dark:text-gray-400">
              <MessageCircle className="w-3 h-3" />
              <span>{task.comments.length}</span>
            </div>
          )}
        </div>

        {/* Avatar placeholder */}
        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <User className="w-3 h-3 text-white" />
        </div>
      </div>
    </div>
  )
}