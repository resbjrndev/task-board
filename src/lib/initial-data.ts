import { Task, Column } from '@/types/board';

export interface BoardData {
  tasks: Task[];
  columns: Column[];
}

export const initialData: BoardData = {
  tasks: [],
  columns: [
    { id: 'todo', title: 'To Do', position: 0 },
    { id: 'in-progress', title: 'In Progress', position: 1 },
    { id: 'done', title: 'Done', position: 2 }
  ]
};
