/**
 * SortableTaskCard Component - Individual Draggable Task Card
 *
 * Responsibilities:
 * - Displays a single task
 * - Makes task draggable using @dnd-kit/sortable
 * - Provides visual feedback during drag
 * - Handles task deletion
 *
 * Key Concepts:
 * - useSortable: Hook that makes element draggable and sortable
 * - CSS.Transform: Converts transform object to CSS string
 * - attributes & listeners: Props needed for drag functionality
 * - Dynamic styling based on drag state
 */

'use client'

import { Task } from '@/types/board'
import { useSortable } from '@dnd-kit/sortable'  // Hook for sortable items
import { CSS } from '@dnd-kit/utilities'         // Transform utility

interface SortableTaskCardProps {
  task: Task              // Task data to display
  onDelete: () => void    // Callback when delete button clicked
}

export default function SortableTaskCard({ task, onDelete }: SortableTaskCardProps) {
  /**
   * SORTABLE HOOK
   * Makes this task draggable and sortable
   * Returns properties and functions needed for drag functionality
   */
  const {
    attributes,    // Accessibility attributes (aria-*, role, etc.)
    listeners,     // Event handlers (onPointerDown, etc.)
    setNodeRef,    // Ref to attach to draggable element
    transform,     // Current transform (position change during drag)
    transition,    // CSS transition string
    isDragging,    // Boolean: is this item currently being dragged?
  } = useSortable({
    id: task.id,   // Unique identifier for this sortable item
  })

  /**
   * DYNAMIC STYLES
   * Apply transform and transition from useSortable
   * - transform: Moves the element during drag
   * - transition: Smooth animation between positions
   * - opacity: Reduce opacity while dragging
   */
  const style = {
    transform: CSS.Transform.toString(transform),  // Convert to CSS format
    transition,                                     // Apply transition
    opacity: isDragging ? 0.5 : 1,                 // Fade during drag
  }

  /**
   * RENDER
   * Task card structure:
   * 1. Card container (draggable)
   * 2. Grip indicator (visual hint)
   * 3. Task content
   * 4. Delete button
   */
  return (
    <div
      ref={setNodeRef}    // Connect to useSortable hook
      style={style}        // Apply dynamic transform/transition
      {...attributes}     // Spread accessibility attributes
      {...listeners}      // Spread drag event listeners
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
      {/* CONTENT CONTAINER */}
      <div className="flex justify-between items-start">
        {/* Task title */}
        <p className="text-sm flex-1 select-none text-slate-700 dark:text-slate-200 font-medium">
          {task.title}
        </p>

        {/*
          DELETE BUTTON
          - Hidden by default (opacity-0)
          - Shown on card hover (group-hover:opacity-100)
          - stopPropagation prevents drag when clicking delete
        */}
        <button
          onClick={(e) => {
            e.stopPropagation()  // Don't trigger drag when clicking delete
            onDelete()           // Call parent's delete handler
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1 -mt-1 -mr-1"
          aria-label="Delete task"
        >
          {/* X icon */}
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
