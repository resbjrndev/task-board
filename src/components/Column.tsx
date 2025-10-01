'use client'

import { useState } from 'react'
import { Column as ColumnType, Task } from '@/types/board'
import { BoardData } from '@/lib/initial-data'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { cn } from '@/utils/cn'
import SortableTaskCard from './SortableTaskCard'
import { v4 as uuidv4 } from 'uuid'

interface ColumnProps {
  column: ColumnType
  tasks: Task[]
  boardData: BoardData
  setBoardData: (data: BoardData) => void
}

export default function Column({ column, tasks, boardData, setBoardData }: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState('')

  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  })

  const handleAddTask = () => {
    if (newTaskContent.trim()) {
      const newTask: Task = {
        id: uuidv4(),
        title: newTaskContent.trim(),
        columnId: column.id,
        position: tasks.length,
      }

      setBoardData({
        ...boardData,
        tasks: [...boardData.tasks, newTask],
      })

      setNewTaskContent('')
      setIsAddingTask(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "bg-gray-100 dark:bg-gray-900 rounded-xl w-80 flex-shrink-0 flex flex-col max-h-full transition-colors",
        isOver && "bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500"
      )}
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

      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin min-h-[200px]">
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onDelete={() => {
                setBoardData({
                  ...boardData,
                  tasks: boardData.tasks.filter(t => t.id !== task.id)
                })
              }}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isAddingTask && (
          <p className="text-gray-400 text-sm text-center py-8">
            Drop tasks here
          </p>
        )}
      </div>

      {isAddingTask ? (
        <div className="p-2">
          <input
            autoFocus
            type="text"
            className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="Enter task..."
            value={newTaskContent}
            onChange={(e) => setNewTaskContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleAddTask()
              }
              if (e.key === 'Escape') {
                setIsAddingTask(false)
                setNewTaskContent('')
              }
            }}
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleAddTask}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Add
            </button>
            <button
              onClick={() => {
                setIsAddingTask(false)
                setNewTaskContent('')
              }}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-400 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="w-full p-3 text-left text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors rounded-b-xl"
        >
          + Add a task
        </button>
      )}
    </div>
  )
}
