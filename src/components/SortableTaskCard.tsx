'use client'

import { Task } from '@/types/board'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface SortableTaskCardProps {
  task: Task
  onDelete: () => void
}

export default function SortableTaskCard({ task, onDelete }: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white dark:bg-gray-800 p-3 rounded-lg shadow
        cursor-grab active:cursor-grabbing
        hover:shadow-md transition-shadow
        border border-gray-200 dark:border-gray-700
        ${isDragging ? 'z-50' : 'z-0'}
        group relative
      `}
    >
      <div className="flex justify-between items-start">
        <p className="text-sm flex-1 select-none text-gray-900 dark:text-white">
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="text-gray-400 hover:text-red-500 transition-colors text-lg leading-none ml-2"
        >
          ×
        </button>
      </div>
    </div>
  )
}
