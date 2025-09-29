import { Board, Task } from './board'

export interface ApiResponse<T> {
  data?: T
  error?: string
  status: 'success' | 'error'
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export interface BoardApiResponse extends ApiResponse<Board> {}
export interface TasksApiResponse extends ApiResponse<Task[]> {}