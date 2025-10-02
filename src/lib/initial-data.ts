/**
 * INITIAL DATA - Default State for the Kanban Board
 *
 * This file provides:
 * - BoardData interface (combines tasks and columns)
 * - Initial data that loads when app first starts
 * - Used as default state before localStorage data is loaded
 */

import { Task, Column } from '@/types/board';

/**
 * BOARD DATA INTERFACE
 * Complete state of the Kanban board
 * Contains all tasks and all columns
 *
 * This is the main data structure managed by useState in page.tsx
 */
export interface BoardData {
  tasks: Task[];      // Array of all tasks across all columns
  columns: Column[];  // Array of all columns (To Do, In Progress, Done)
}

/**
 * INITIAL DATA
 * Default board state
 *
 * Used when:
 * - App first loads (before localStorage)
 * - No saved data exists in localStorage
 * - Provides example tasks to demonstrate the board
 */
export const initialData: BoardData = {
  // Sample tasks to populate the board
  tasks: [
    { id: 'task-1', title: 'Test Task 1', columnId: 'todo', position: 0 },
    { id: 'task-2', title: 'Test Task 2', columnId: 'todo', position: 1 },
    { id: 'task-3', title: 'Test Task 3', columnId: 'in-progress', position: 0 },
  ],

  // The three standard Kanban columns
  columns: [
    { id: 'todo', title: 'To Do', position: 0 },               // Blue gradient
    { id: 'in-progress', title: 'In Progress', position: 1 },  // Orange gradient
    { id: 'done', title: 'Done', position: 2 }                 // Green gradient
  ]
};
