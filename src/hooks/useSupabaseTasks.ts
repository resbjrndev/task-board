/**
 * CUSTOM HOOK: useSupabaseTasks
 *
 * Manages all task and column data with Supabase
 * Provides real-time updates using Supabase subscriptions
 *
 * Features:
 * - Fetch tasks and columns on mount
 * - Add, update, delete tasks
 * - Real-time updates when data changes
 * - Loading and error states
 */

'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { BoardData } from '@/lib/initial-data'
import type { Task, Column } from '@/types/board'

export function useSupabaseTasks() {
  // STATE
  const [boardData, setBoardData] = useState<BoardData>({ tasks: [], columns: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * FETCH INITIAL DATA
   * Loads all columns and tasks from Supabase
   */
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch columns
      const { data: columnsData, error: columnsError } = await supabase
        .from('columns')
        .select('*')
        .order('position', { ascending: true })

      if (columnsError) throw columnsError

      // Fetch tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .order('position', { ascending: true })

      if (tasksError) throw tasksError

      // Transform database format to app format
      const columns: Column[] = (columnsData || []).map(col => ({
        id: col.id,
        title: col.title,
        position: col.position
      }))

      const tasks: Task[] = (tasksData || []).map(task => ({
        id: task.id,
        title: task.title,
        columnId: task.column_id,
        position: task.position
      }))

      setBoardData({ columns, tasks })
    } catch (err: any) {
      console.error('Error fetching data:', err)
      setError(err.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  /**
   * ADD NEW TASK
   * Inserts a task into Supabase
   */
  const addTask = async (task: Omit<Task, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: task.title,
          column_id: task.columnId,
          position: task.position
        })
        .select()
        .single()

      if (error) throw error

      // Optimistic update - add to local state immediately
      if (data) {
        const newTask: Task = {
          id: data.id,
          title: data.title,
          columnId: data.column_id,
          position: data.position
        }
        setBoardData(prev => ({
          ...prev,
          tasks: [...prev.tasks, newTask]
        }))
      }
    } catch (err: any) {
      console.error('Error adding task:', err)
      setError(err.message || 'Failed to add task')
    }
  }

  /**
   * UPDATE TASK
   * Updates a task in Supabase (e.g., moving to different column)
   */
  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      const dbUpdates: any = {}
      if (updates.title !== undefined) dbUpdates.title = updates.title
      if (updates.columnId !== undefined) dbUpdates.column_id = updates.columnId
      if (updates.position !== undefined) dbUpdates.position = updates.position

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', taskId)

      if (error) throw error

      // Optimistic update
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === taskId
            ? { ...task, ...updates }
            : task
        )
      }))
    } catch (err: any) {
      console.error('Error updating task:', err)
      setError(err.message || 'Failed to update task')
    }
  }

  /**
   * DELETE TASK
   * Removes a task from Supabase
   */
  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      // Optimistic update
      setBoardData(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== taskId)
      }))
    } catch (err: any) {
      console.error('Error deleting task:', err)
      setError(err.message || 'Failed to delete task')
    }
  }

  /**
   * EFFECT: Initial data fetch and real-time subscription
   */
  useEffect(() => {
    // Fetch initial data
    fetchData()

    // Subscribe to real-time changes
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          console.log('Task change detected:', payload)
          // Refetch data when changes occur from other clients
          fetchData()
        }
      )
      .subscribe()

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(tasksChannel)
    }
  }, [])

  return {
    boardData,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    refetch: fetchData
  }
}
