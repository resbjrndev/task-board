'use client'

import { cn } from '@/utils/cn'

interface BoardContainerProps {
  children: React.ReactNode
  className?: string
}

export function BoardContainer({ children, className }: BoardContainerProps) {
  return (
    <div className={cn(
      "flex-1 flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950",
      className
    )}>
      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-4 p-6 h-full min-w-max">
          {children}
        </div>
      </div>
    </div>
  )
}