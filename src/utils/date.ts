import { format, formatDistanceToNow, isPast, isToday } from 'date-fns'

export const formatDate = (date: string | Date) => {
  return format(new Date(date), 'MMM d, yyyy')
}

export const getRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export const isOverdue = (date: string | Date) => {
  return isPast(new Date(date)) && !isToday(new Date(date))
}