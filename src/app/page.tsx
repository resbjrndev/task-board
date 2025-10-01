'use client'

import { useState, useCallback, useEffect } from 'react'
import { BoardHeader } from '@/components/board/BoardHeader'
import { BoardContainer } from '@/components/board/BoardContainer'
import { ColumnContainer } from '@/components/board/ColumnContainer'
import { DndProvider } from '@/components/providers/DndProvider'
import type { DragEndEvent } from '@dnd-kit/core'
import { initialData, type BoardData } from '@/lib/initial-data'

export default function Home() {
  const [boardData, setBoardData] = useState<BoardData>(initialData)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('kanban-board')
    if (saved) {
      try {
        setBoardData(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load board data')
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('kanban-board', JSON.stringify(boardData))
    }
  }, [boardData, mounted])

  const getTasksForColumn = useCallback((columnId: string) => {
    return boardData.tasks.filter(task => task.columnId === columnId)
  }, [boardData.tasks])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeTaskId = active.id as string
    const overColumnId = over.id as string

    const activeTask = boardData.tasks.find(task => task.id === activeTaskId)
    if (!activeTask || activeTask.columnId === overColumnId) return

    setBoardData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === activeTaskId
          ? { ...task, columnId: overColumnId }
          : task
      )
    }))
  }, [boardData.tasks])

  const handleAddTask = useCallback((columnId: string) => {
    const title = prompt('Enter task title:')
    if (!title) return

    const newTask = {
      id: Date.now().toString(),
      title,
      columnId,
      position: boardData.tasks.filter(t => t.columnId === columnId).length,
    }

    setBoardData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }))
  }, [boardData.tasks])

  const handleDeleteTask = useCallback((taskId: string) => {
    if (confirm('Delete this task?')) {
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId)
      }))
    }
  }, [])

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen">
      <BoardHeader />
      <DndProvider onDragEnd={handleDragEnd}>
        <BoardContainer>
          {boardData.columns.map((column) => (
            <ColumnContainer
              key={column.id}
              column={column}
              tasks={getTasksForColumn(column.id)}
              onAddTask={() => handleAddTask(column.id)}
              onDeleteTask={handleDeleteTask}
            />
          ))}
        </BoardContainer>
      </DndProvider>
    </div>
  )
}
