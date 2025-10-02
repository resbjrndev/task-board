/**
 * Board Component - Main Kanban Board Container
 *
 * Responsibilities:
 * - Manages drag-and-drop functionality using @dnd-kit library
 * - Handles task movement between columns
 * - Renders all columns and provides drag overlay
 * - Coordinates state updates between columns
 *
 * Key Concepts:
 * - Uses DndContext from @dnd-kit/core for drag-and-drop
 * - Implements collision detection to find drop targets
 * - Provides visual feedback during drag operations
 */

'use client'

import { useState, useRef } from 'react'
import { BoardData } from '@/lib/initial-data'
import type { Task } from '@/types/board'
// Import drag-and-drop utilities from @dnd-kit
import {
  DndContext,          // Main context provider for drag-and-drop
  DragEndEvent,        // Type for drag end event
  DragStartEvent,      // Type for drag start event
  DragOverlay,         // Component that shows dragged item following cursor
  DragOverEvent,       // Type for drag over event (while dragging)
  closestCorners,      // Collision detection algorithm
  PointerSensor,       // Detects pointer/mouse events
  useSensor,           // Hook to configure sensors
  useSensors           // Hook to combine multiple sensors
} from '@dnd-kit/core'
import Column from './Column'
import TaskCard from './TaskCard'
import { kbApi } from '@/lib/kbApi'

// Props interface - defines what data this component receives
interface BoardProps {
  boardData: BoardData                    // Current state of board (tasks + columns)
  setBoardData: (data: BoardData) => void // Function to update board state
}

export default function Board({ boardData, setBoardData }: BoardProps) {
  // STATE: Track which task is currently being dragged
  // null when nothing is being dragged
  const [activeTask, setActiveTask] = useState<Task | null>(null)

  // Store original column ID for rollback on error
  const dragStartColumnRef = useRef<string | null>(null)

  /**
   * SENSOR CONFIGURATION
   * Sensors detect user input (mouse, touch, keyboard)
   * PointerSensor handles mouse/touch events
   * activationConstraint: user must drag 8px before drag starts
   * This prevents accidental drags when clicking
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Minimum pixels to move before drag activates
      },
    })
  )

  /**
   * DRAG START HANDLER
   * Called when user starts dragging a task
   * - Finds the task being dragged
   * - Stores it in state to show in DragOverlay
   */
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event // 'active' is the item being dragged
    // Find the task in our data that matches the dragged item's ID
    const task = boardData.tasks.find(t => t.id === active.id)
    if (task) {
      setActiveTask(task) // Store for overlay display
      dragStartColumnRef.current = task.columnId // Store original column for rollback
    }
  }

  /**
   * DRAG OVER HANDLER
   * Called continuously while dragging over droppable areas
   * Provides real-time feedback by moving task to hovered column
   * This creates smooth visual feedback during drag
   */
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event // 'over' is what we're hovering over

    if (!over) return // Not hovering over anything droppable

    const activeId = active.id as string  // ID of task being dragged
    const overId = over.id as string      // ID of element we're over

    // Find the task being dragged
    const activeTask = boardData.tasks.find(t => t.id === activeId)
    if (!activeTask) return

    // Check if we're hovering over a column (not another task)
    const overColumn = boardData.columns.find(col => col.id === overId)

    // If hovering over a column AND it's different from current column
    if (overColumn && activeTask.columnId !== overColumn.id) {
      // Update task's column immediately for visual feedback
      setBoardData({
        ...boardData, // Keep everything else the same
        tasks: boardData.tasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: overColumn.id } // Update this task's column
            : task // Keep other tasks unchanged
        )
      })
    }
  }

  /**
   * DRAG END HANDLER
   * Called when user releases the dragged task
   * Persists changes to API with optimistic updates and rollback on error
   */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    // If not dropped over anything valid, just reset
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

    // Determine target column
    let targetColumnId = overId
    const overTask = boardData.tasks.find(t => t.id === overId)
    if (overTask) {
      targetColumnId = overTask.columnId
    }

    // Clear drag state
    setActiveTask(null)
    dragStartColumnRef.current = null

    // Check if column changed
    const movedToNewColumn = originalColumnId !== targetColumnId

    if (movedToNewColumn) {
      // CROSS-COLUMN MOVE
      // Optimistically update UI
      const previousData = { ...boardData }
      setBoardData({
        ...boardData,
        tasks: boardData.tasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: targetColumnId }
            : task
        )
      })

      try {
        // Update task's column in API
        await kbApi.updateTask(activeId, { columnId: targetColumnId })

        // Reorder both source and destination columns
        const sourceTasks = boardData.tasks
          .filter(t => t.id !== activeId && t.columnId === originalColumnId)
          .sort((a, b) => a.position - b.position)
          .map(t => t.id)

        const destTasks = [
          ...boardData.tasks
            .filter(t => t.columnId === targetColumnId)
            .sort((a, b) => a.position - b.position)
            .map(t => t.id),
          activeId // Append to end
        ]

        await Promise.all([
          sourceTasks.length > 0 ? kbApi.reorderTasks(originalColumnId, sourceTasks) : Promise.resolve(),
          kbApi.reorderTasks(targetColumnId, destTasks)
        ])
      } catch (err) {
        console.error('Failed to move task:', err)
        // Rollback on error
        setBoardData(previousData)
      }
    } else {
      // SAME-COLUMN REORDER
      const columnTasks = boardData.tasks
        .filter(t => t.columnId === targetColumnId)
        .sort((a, b) => a.position - b.position)

      const oldIndex = columnTasks.findIndex(t => t.id === activeId)
      const newIndex = overTask
        ? columnTasks.findIndex(t => t.id === overId)
        : columnTasks.length - 1

      if (oldIndex !== newIndex && oldIndex !== -1) {
        // Reorder in place
        const reordered = [...columnTasks]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)

        // Optimistically update UI
        const previousData = { ...boardData }
        const updatedTasks = boardData.tasks.map(task => {
          if (task.columnId !== targetColumnId) return task
          const newPos = reordered.findIndex(t => t.id === task.id)
          return { ...task, position: newPos }
        })

        setBoardData({ ...boardData, tasks: updatedTasks })

        try {
          // Persist to API
          await kbApi.reorderTasks(targetColumnId, reordered.map(t => t.id))
        } catch (err) {
          console.error('Failed to reorder tasks:', err)
          // Rollback on error
          setBoardData(previousData)
        }
      }
    }
  }

  /**
   * RENDER
   * DndContext wraps everything to enable drag-and-drop
   * - sensors: How to detect drag events
   * - collisionDetection: Algorithm to find what's under cursor
   * - Event handlers: What to do on drag start/over/end
   */
  return (
    <DndContext
      sensors={sensors}                      // Use pointer sensor configured above
      collisionDetection={closestCorners}    // Find nearest droppable by corners
      onDragStart={handleDragStart}          // When drag starts
      onDragOver={handleDragOver}            // While dragging
      onDragEnd={handleDragEnd}              // When drag ends
    >
      {/*
        COLUMNS CONTAINER
        - flex: columns arranged horizontally
        - gap-4: spacing between columns
        - overflow-x-auto: horizontal scroll if columns don't fit
      */}
      <div className="flex gap-4 overflow-x-auto pb-4 p-6">
        {/*
          Map over each column and render it
          For each column, we filter tasks to only show tasks belonging to that column
        */}
        {boardData.columns.map((column) => {
          // Get tasks for this specific column
          const tasks = boardData.tasks.filter(task => task.columnId === column.id)

          return (
            <Column
              key={column.id}              // Unique key for React reconciliation
              column={column}              // Column data (id, title, position)
              tasks={tasks}                // Tasks belonging to this column
              boardData={boardData}        // Full board data (needed for updates)
              setBoardData={setBoardData}  // Function to update board state
            />
          )
        })}
      </div>

      {/*
        DRAG OVERLAY
        This component follows the cursor during drag
        Shows a copy of the task being dragged
        Only renders when actively dragging (activeTask is not null)
      */}
      <DragOverlay>
        {activeTask ? (
          <TaskCard task={activeTask} isDragging />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
