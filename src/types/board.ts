export type Priority = 'low' | 'medium' | 'high'
export type LabelColor = 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange' | 'pink' | 'gray'

export interface Label {
  id: string
  name: string
  color: LabelColor
}

export interface Attachment {
  id: string
  name: string
  url: string
  size: number
  uploadedAt: string
}

export interface Comment {
  id: string
  text: string
  authorId: string
  createdAt: string
  updatedAt?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  columnId: string
  priority: Priority
  dueDate?: string
  labels: Label[]
  position: number
  attachments: Attachment[]
  comments: Comment[]
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface Column {
  id: string
  title: string
  position: number
  color?: string
  taskLimit?: number
  collapsed?: boolean
}

export interface Board {
  id: string
  title: string
  description?: string
  columns: Column[]
  tasks: Task[]
  labels: Label[]
  createdAt: string
  updatedAt: string
}