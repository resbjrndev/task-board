'use client'

import { useState } from 'react'
import { BoardData } from '@/lib/initial-data'
import type { Task } from '@/types/board'
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core'
import Column from './Column'
import TaskCard from './TaskCard'

interface BoardProps {
  boardData: BoardData
  setBoardData: (data: BoardData) => void
}

export default function Board({ boardData, setBoardData }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const task = boardData.tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task)
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    const activeTask = boardData.tasks.find(t => t.id === activeId)
    if (!activeTask) return

    const overColumn = boardData.columns.find(col => col.id === overId)

    if (overColumn && activeTask.columnId !== overColumn.id) {
      setBoardData({
        ...boardData,
        tasks: boardData.tasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: overColumn.id }
            : task
        )
      })
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const draggedTask = boardData.tasks.find(t => t.id === activeId)
    if (!draggedTask) {
      setActiveTask(null)
      return
    }

    let targetColumnId = overId

    const overTask = boardData.tasks.find(t => t.id === overId)
    if (overTask) {
      targetColumnId = overTask.columnId
    }

    if (draggedTask.columnId !== targetColumnId) {
      setBoardData({
        ...boardData,
        tasks: boardData.tasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: targetColumnId }
            : task
        )
      })
    }

    setActiveTask(null)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 p-6">
        {boardData.columns.map((column) => {
          const tasks = boardData.tasks.filter(task => task.columnId === column.id)

          return (
            <Column
              key={column.id}
              column={column}
              tasks={tasks}
              boardData={boardData}
              setBoardData={setBoardData}
            />
          )
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
