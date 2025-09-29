import { z } from 'zod'

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().optional(),
  labelIds: z.array(z.string()),
})

export const columnFormSchema = z.object({
  title: z.string().min(1, 'Column name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color').optional(),
  taskLimit: z.number().min(1).max(100).optional(),
})

export const boardFormSchema = z.object({
  title: z.string().min(1, 'Board name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
})

export type TaskFormData = z.infer<typeof taskFormSchema>
export type ColumnFormData = z.infer<typeof columnFormSchema>
export type BoardFormData = z.infer<typeof boardFormSchema>