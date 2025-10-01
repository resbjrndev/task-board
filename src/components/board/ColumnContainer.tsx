'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { Column, Task } from '@/types/board'
import { TaskCard } from './TaskCard'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

interface ColumnContainerProps {
  column: Column
  tasks: Task[]
  onAddTask?: () => void
  onDeleteTask?: (taskId: string) => void
}

export function ColumnContainer({
  column,
  tasks,
  onAddTask,
  onDeleteTask
}: ColumnContainerProps) {
  const [isHovered, setIsHovered] = useState(false)
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })
  const taskIds = tasks.map(task => task.id)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col bg-gray-100 dark:bg-gray-900 rounded-xl w-80 max-h-full transition-all duration-200",
        isHovered && "shadow-lg scale-[1.02]",
        isOver && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center space-x-2">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {column.title}
          </h3>
          <span className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDelete={onDeleteTask ? () => onDeleteTask(task.id) : undefined}
            />
          ))}
        </SortableContext>
      </div>

      <button
        onClick={onAddTask}
        className={cn(
          "flex items-center space-x-2 w-full p-3 text-left hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors rounded-b-xl cursor-pointer",
          "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        )}
      >
        <Plus className="w-4 h-4" />
        <span>Add a card</span>
      </button>
    </div>
  )
}