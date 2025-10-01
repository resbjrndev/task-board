'use client'

import type { Task } from '@/types/board'

interface TaskCardProps {
  task: Task
  isDragging?: boolean
}

export default function TaskCard({ task, isDragging }: TaskCardProps) {
  if (!isDragging) return null

  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl opacity-90 cursor-grabbing rotate-3 border border-gray-200 dark:border-gray-700">
      <p className="text-sm text-gray-900 dark:text-white">{task.title}</p>
    </div>
  )
}
