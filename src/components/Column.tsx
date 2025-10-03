'use client'

import { useState } from 'react'
import { Column as ColumnType, Task } from '@/types/board'
import { BoardData } from '@/lib/initial-data'
import { useDroppable } from '@dnd-kit/core'          
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable' 
import SortableTaskCard from './SortableTaskCard'
import { kbApi } from '@/lib/kbApi'


interface ColumnProps {
  column: ColumnType             
  tasks: Task[]                
  boardData: BoardData           
  setBoardData: (data: BoardData | ((prev: BoardData) => BoardData)) => void 
}

export default function Column({ column, tasks, boardData, setBoardData }: ColumnProps) {

  const [isAddingTask, setIsAddingTask] = useState(false)
  const [newTaskContent, setNewTaskContent] = useState('')


  const { setNodeRef, isOver } = useDroppable({
    id: column.id, 
  })


  const handleAddTask = async () => {
    if (!newTaskContent.trim()) return; 

    const title = newTaskContent.trim();

    
    setNewTaskContent('');
    setIsAddingTask(false);


    const tempId = `temp-${Date.now()}`;
    const tempTask: Task = {
      id: tempId,
      title,
      columnId: column.id,
      position: tasks.length,
    };

    const previousData = { ...boardData };
    setBoardData((prev: BoardData) => ({
      ...prev,
      tasks: [...prev.tasks, tempTask],
    }));

    try {
  
      const response = await kbApi.createTask(column.id, title);

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

      setBoardData(previousData);

      alert('Failed to create task. Please try again.');
    }
  }


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

      <div className={`
        px-4 py-3 rounded-t-xl
        ${column.position === 0 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : ''}
        ${column.position === 1 ? 'bg-gradient-to-r from-amber-500 to-orange-500' : ''}
        ${column.position === 2 ? 'bg-gradient-to-r from-emerald-500 to-green-500' : ''}
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


      <div
        ref={setNodeRef} 
        className={`
          flex-1 p-3 space-y-2
          min-h-[200px] max-h-[calc(100vh-250px)]
          overflow-y-auto overflow-x-hidden
          ${isOver ? 'bg-violet-50 dark:bg-violet-950/20' : ''}
          transition-colors duration-200
        `}
      >
     
        <SortableContext
          items={tasks.map(t => t.id)}           
          strategy={verticalListSortingStrategy}  
        >
          {/* Render each task */}
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onDelete={async () => {
                
                const previousData = { ...boardData };
                setBoardData((prev: BoardData) => ({
                  ...prev,
                  tasks: prev.tasks.filter(t => t.id !== task.id)
                }));

                try {
                  
                  await kbApi.deleteTask(task.id);
                } catch (err) {
                  console.error('Failed to delete task:', err);
                  
                  setBoardData(previousData);
                  alert('Failed to delete task. Please try again.');
                }
              }}
            />
          ))}
        </SortableContext>

   
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


      {isAddingTask && (
        <div className="p-3 animate-slide-up">
          <div className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
    
            <textarea
              autoFocus  
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400 placeholder-slate-400"
              placeholder="What needs to be done?"
              value={newTaskContent}
              onChange={(e) => setNewTaskContent(e.target.value)}
              onKeyDown={(e) => {
                
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();  
                  handleAddTask();
                }
                
                if (e.key === 'Escape') {
                  setIsAddingTask(false);
                  setNewTaskContent('');
                }
              }}
              rows={2}  
            />

            <div className="flex gap-2 mt-2">
 
              <button
                onClick={handleAddTask}
                className="flex-1 px-3 py-1.5 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Add Task
              </button>             <button
                onClick={() => {
                  setIsAddingTask(false);   
                  setNewTaskContent('');    
                }}
                className="px-3 py-1.5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 text-sm font-medium rounded-lg transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

 
      {!isAddingTask && (
        <button
          onClick={() => setIsAddingTask(true)}
          className="group flex items-center justify-center gap-2 w-full p-3 rounded-b-xl border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all duration-200"
        >
          <svg className="w-5 h-5 text-slate-400 group-hover:text-violet-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200">
            Add a task
          </span>
        </button>
      )}
    </div>
  )
}
