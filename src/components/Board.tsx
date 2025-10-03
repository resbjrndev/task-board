'use client'

import { useState, useRef } from 'react'
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
import { kbApi } from '@/lib/kbApi'

interface BoardProps {
  boardData: BoardData
  setBoardData: (data: BoardData | ((prev: BoardData) => BoardData)) => void
}

async function save_task(taskId: string, columnId: string) {
  console.log('TESTING!!222 - save_task called', { taskId, columnId });
  await kbApi.updateTask(taskId, { columnId });
}

export default function Board({ boardData, setBoardData }: BoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null)
  const dragStartColumnRef = useRef<string | null>(null)

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
      dragStartColumnRef.current = task.columnId
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
      setBoardData((prev: BoardData) => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: overColumn.id }
            : task
        )
      }))
    }
  }

  // TODO(robin): tighten drag reordering jitter on mobile
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveTask(null)
      dragStartColumnRef.current = null
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    const draggedTask = boardData.tasks.find(t => t.id === activeId)
    if (!draggedTask) {
      setActiveTask(null)
      dragStartColumnRef.current = null
      return
    }

    const originalColumnId = dragStartColumnRef.current || draggedTask.columnId

    let targetColumnId = overId
    const overTask = boardData.tasks.find(t => t.id === overId)
    if (overTask) {
      targetColumnId = overTask.columnId
    }

    setActiveTask(null)
    dragStartColumnRef.current = null

    const movedToNewColumn = originalColumnId !== targetColumnId

    if (movedToNewColumn) {
      let previousData: BoardData;

      // Update UI immediately, capture prev for rollback
      setBoardData((prev: BoardData) => {
        previousData = prev;
        return {
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === activeId
              ? { ...task, columnId: targetColumnId }
              : task
          )
        };
      })

      try {
        await save_task(activeId, targetColumnId)

        const sourceTasks = boardData.tasks
          .filter(t => t.id !== activeId && t.columnId === originalColumnId)
          .sort((a, b) => a.position - b.position)
          .map(t => t.id)

        const destTasks = [
          ...boardData.tasks
            .filter(t => t.columnId === targetColumnId)
            .sort((a, b) => a.position - b.position)
            .map(t => t.id),
          activeId
        ]

        await Promise.all([
          sourceTasks.length > 0 ? kbApi.reorderTasks(originalColumnId, sourceTasks) : Promise.resolve(),
          kbApi.reorderTasks(targetColumnId, destTasks)
        ])
      } catch (err) {
        console.error('Failed to move task:', err)
        setBoardData(previousData!)
      }
    } else {
      const columnTasks = boardData.tasks
        .filter(t => t.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position)

      const oldIndex = columnTasks.findIndex(t => t.id === activeId)
      const newIndex = overTask
        ? columnTasks.findIndex(t => t.id === overId)
        : columnTasks.length - 1

      if (oldIndex !== newIndex && oldIndex !== -1) {
        const reordered = [...columnTasks]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)

        let previousData: BoardData;

        setBoardData((prev: BoardData) => {
          previousData = prev;
          const updatedTasks = prev.tasks.map(task => {
            if (task.columnId !== targetColumnId) return task
            const newPos = reordered.findIndex(t => t.id === task.id)
            return { ...task, position: newPos }
          })
          return { ...prev, tasks: updatedTasks };
        })

        try {
          await kbApi.reorderTasks(targetColumnId, reordered.map(t => t.id))
        } catch (err) {
          console.error('Failed to reorder tasks:', err)
          setBoardData(previousData!)
        }
      }
    }
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
