/**
 * Column Component - Individual Kanban Column
 *
 * Responsibilities:
 * - Displays a single column (To Do, In Progress, Done)
 * - Renders all tasks within the column
 * - Provides droppable area for dragging tasks
 * - Handles adding new tasks to the column
 * - Manages task deletion
 *
 * Key Concepts:
 * - useDroppable: Makes column a valid drop target
 * - SortableContext: Enables sorting tasks within column
 * - Dynamic styling based on column ID (different colors per column)
 */

'use client'

import { useState } from 'react'
import { Column as ColumnType, Task } from '@/types/board'
import { BoardData } from '@/lib/initial-data'
import { useDroppable } from '@dnd-kit/core'              // Makes element droppable
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable' // Enables sorting
import SortableTaskCard from './SortableTaskCard'
import { kbApi } from '@/lib/kbApi'

// Props type definition
interface ColumnProps {
  column: ColumnType              // Column metadata (id, title, position)
  tasks: Task[]                   // Tasks belonging to this column
  boardData: BoardData            // Full board state
  setBoardData: (data: BoardData) => void // Function to update board
}

export default function Column({ column, tasks, boardData, setBoardData }: ColumnProps) {
  // STATE: Track if user is currently adding a new task
  const [isAddingTask, setIsAddingTask] = useState(false)
  // STATE: Content of new task being typed
  const [newTaskContent, setNewTaskContent] = useState('')

  /**
   * DROPPABLE HOOK
   * Makes this column a valid drop target for dragged tasks
   * - setNodeRef: Attach to the DOM element that should be droppable
   * - isOver: Boolean indicating if something is being dragged over this column
   */
  const { setNodeRef, isOver } = useDroppable({
    id: column.id, // Unique identifier for this droppable area
  })

  /**
   * ADD TASK HANDLER
   * Creates a new task and persists to API
   * - Validates input (non-empty)
   * - Calls API to create task
   * - Updates local state optimistically
   * - Resets form
   */
  const handleAddTask = async () => {
    if (!newTaskContent.trim()) return; // Only proceed if input is not empty

    const title = newTaskContent.trim();

    // Reset form immediately for better UX
    setNewTaskContent('');
    setIsAddingTask(false);

    // Optimistic update: create temporary task with placeholder ID
    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title,
      columnId: column.id,
      position: tasks.length,
    };

    // Update UI immediately
    const previousData = { ...boardData };
    setBoardData((prev: BoardData) => ({
      ...prev,
      tasks: [...prev.tasks, tempTask],
    }));

    try {
      // Persist to API
      const response = await kbApi.createTask(column.id, title);

      // Replace temp task with real task from API
      setBoardData((prev: BoardData) => ({
        ...prev,
        tasks: prev.tasks.map(t =>
          t.id === tempId
            ? {
                id: response.task.id,
                title: response.task.title,
                description: response.task.description,
                columnId: response.task.column_id,
                position: response.task.position,
              }
            : t
        ),
      }));
    } catch (err) {
      console.error('Failed to create task:', err);
      // Rollback on error
      setBoardData(previousData);
      // Show error to user
      alert('Failed to create task. Please try again.');
    }
  }

  /**
   * RENDER
   * Column structure:
   * 1. Column container (droppable)
   * 2. Header with title and count
   * 3. Tasks area (sortable)
   * 4. Add task button/form
   */
  return (
    <div className={`
      flex flex-col w-80 flex-shrink-0
      bg-white dark:bg-slate-800
      rounded-xl
      shadow-sm hover:shadow-xl
      border border-slate-200 dark:border-slate-700
      transition-all duration-300
      ${isOver ? 'ring-2 ring-violet-400 dark:ring-violet-500 scale-[1.02]' : ''}
    `}>
      {/*
        COLUMN HEADER
        Dynamic gradient based on column ID:
        - 'todo': Blue gradient
        - 'in-progress': Orange gradient
        - 'done': Green gradient
        This provides visual differentiation between columns
      */}
      <div className={`
        px-4 py-3 rounded-t-xl
        ${column.id === 'todo' ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}
        ${column.id === 'in-progress' ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}
        ${column.id === 'done' ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
      `}>
        <div className="flex items-center justify-between">
          {/* Column title */}
          <h2 className="font-semibold text-white">
            {column.title}
          </h2>
          {/* Task count badge */}
          <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/*
        TASKS CONTAINER
        - ref={setNodeRef}: Connects to useDroppable hook
        - This makes the area a valid drop target
        - Background changes when dragging over (isOver)
      */}
      <div
        ref={setNodeRef}  // Make this element droppable
        className={`
          flex-1 p-3 space-y-2
          min-h-[200px] max-h-[calc(100vh-250px)]
          overflow-y-auto overflow-x-hidden
          ${isOver ? 'bg-violet-50 dark:bg-violet-950/20' : ''}
          transition-colors duration-200
        `}
      >
        {/*
          SORTABLE CONTEXT
          Enables reordering tasks within this column
          - items: Array of task IDs that can be sorted
          - strategy: Vertical list sorting algorithm
        */}
        <SortableContext
          items={tasks.map(t => t.id)}           // Extract IDs for sorting
          strategy={verticalListSortingStrategy}  // Use vertical sorting
        >
          {/* Render each task */}
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onDelete={async () => {
                // Optimistic delete: remove from UI immediately
                const previousData = { ...boardData };
                setBoardData((prev: BoardData) => ({
                  ...prev,
                  tasks: prev.tasks.filter(t => t.id !== task.id)
                }));

                try {
                  // Persist to API
                  await kbApi.deleteTask(task.id);
                } catch (err) {
                  console.error('Failed to delete task:', err);
                  // Rollback on error
                  setBoardData(previousData);
                  alert('Failed to delete task. Please try again.');
                }
              }}
            />
          ))}
        </SortableContext>

        {/*
          EMPTY STATE
          Shows when column has no tasks
          Provides visual feedback and instructions
        */}
        {tasks.length === 0 && !isAddingTask && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400 dark:text-slate-500">
            {/* Plus icon in circle */}
            <div className="w-16 h-16 mb-3 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <p className="text-sm font-medium">No tasks here</p>
            <p className="text-xs mt-1 text-slate-400 dark:text-slate-600">Drop tasks here</p>
          </div>
        )}
      </div>

      {/*
        ADD TASK FORM
        Conditionally rendered when isAddingTask is true
        - animate-slide-up: CSS animation for smooth appearance
        - Textarea for multi-line input
        - Keyboard shortcuts: Enter to submit, Escape to cancel
      */}
      {isAddingTask && (
        <div className="p-3 animate-slide-up">
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
            {/* Task input textarea */}
            <textarea
              autoFocus  // Automatically focus when form appears
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 placeholder-slate-400"
              placeholder="What needs to be done?"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                // Enter (without Shift) = Submit
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();  // Prevent newline
                  handleAddTask();
                }
                // Escape = Cancel
                if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskContent('');
                }
              }}
              rows={2}  // Initial height
            />
            {/* Action buttons */}
            <div className="flex gap-2 mt-2">
              {/* Submit button */}
              <button
                onClick={handleAddTask}
                className="flex-1 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Add Task
              </button>
              {/* Cancel button */}
              <button
                onClick={() => {
                  setIsAddingTask(false);   // Hide form
                  setNewTaskContent('');    // Clear input
                }}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        ADD TASK BUTTON
        Shows when not adding a task
        Clicking this reveals the form above
      */}
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="group flex items-center justify-center gap-2 w-full p-3 rounded-b-xl border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          {/* Plus icon */}
          <svg className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {/* Button text */}
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
            Add a task
          </span>
        </button>
      )}
    </div>
  )
}
