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
        group relative
        bg-white dark:bg-slate-700/50
        backdrop-blur-sm
        rounded-lg
        p-3
        border border-slate-200 dark:border-slate-600
        shadow-sm hover:shadow-md
        cursor-grab active:cursor-grabbing
        transition-all duration-200
        ${isDragging ? 'opacity-50 scale-105 rotate-2' : ''}
        hover:border-violet-300 dark:hover:border-violet-600
        hover:-translate-y-0.5
      `}
    >
      {/* Grip Indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-500 rounded-full"></span>
        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-500 rounded-full"></span>
        <span className="w-1 h-1 bg-slate-300 dark:bg-slate-500 rounded-full"></span>
      </div>

      <div className="flex justify-between items-start pl-3">
        <p className="text-sm flex-1 select-none text-slate-700 dark:text-slate-200 font-medium">
          {task.title}
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1 -mt-1 -mr-1"
          aria-label="Delete task"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
