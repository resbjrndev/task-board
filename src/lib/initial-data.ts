import { Task, Column } from '@/types/board';

export interface BoardData {
  tasks: Task[];
  columns: Column[];
}

export const initialData: BoardData = {
  tasks: [
    { id: 'task-1', title: 'Test Task 1', columnId: 'todo', position: 0 },
    { id: 'task-2', title: 'Test Task 2', columnId: 'todo', position: 1 },
    { id: 'task-3', title: 'Test Task 3', columnId: 'in-progress', position: 0 },
  ],
  columns: [
    { id: 'todo', title: 'To Do', position: 0 },
    { id: 'in-progress', title: 'In Progress', position: 1 },
    { id: 'done', title: 'Done', position: 2 }
  ]
};
