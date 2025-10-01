'use client'

import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { Task } from '@/types/board'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onDelete?: () => void
}

export function TaskCard({ task, onClick, onDelete }: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "bg-white dark:bg-gray-800 rounded-lg p-3 cursor-pointer transition-all duration-200",
        "border border-gray-200 dark:border-gray-700",
        isHovered && "shadow-md scale-[1.02] border-blue-300 dark:border-blue-600",
        isDragging && "opacity-50 z-50"
      )}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
          {task.title}
        </h4>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </div>
  )
}