'use client'

export function BoardHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            Task Board
          </h1>
        </div>
      </div>
    </header>
  )
}
