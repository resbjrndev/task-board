'use client'

import { useState, useEffect } from 'react'
import { BoardHeader } from '@/components/BoardHeader'
import Board from '@/components/Board'
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

  if (!mounted) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
      <BoardHeader />
      <div className="flex-1 overflow-hidden">
        <Board
          boardData={boardData}
          setBoardData={setBoardData}
        />
      </div>
    </div>
  )
}
