/**
 * Main Page Component - Task Board Application
 *
 * This is the root page component that manages:
 * - Board data state (tasks and columns)
 * - Theme toggling (light/dark mode)
 * - Data persistence using localStorage
 * - Hydration safety with the 'mounted' pattern
 */

'use client'; // Next.js directive - marks this as a Client Component (can use hooks, events, browser APIs)

import { useState, useEffect } from 'react';
import { BoardData } from '@/lib/initial-data';
import Board from '@/components/Board';
import { kbApi } from '@/lib/kbApi';

export default function Home() {
  // STATE MANAGEMENT
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // EFFECT: Initialize theme and load data from API
  useEffect(() => {
    // THEME INITIALIZATION
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');

    // LOAD DATA FROM API
    kbApi.boot()
      .then((data) => {
        // Transform API response to match BoardData format
        const allTasks = Object.values(data.tasksByColumn).flat().map((task: { id: string; title: string; description: string | null; column_id: string; position: number }) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          columnId: task.column_id,
          position: task.position,
        }));

        const transformedData: BoardData = {
          columns: data.columns,
          tasks: allTasks,
        };
        setBoardData(transformedData);
        setLoading(false);
        setMounted(true);
      })
      .catch((err) => {
        console.error('Failed to load board:', err);
        setError(err.message);
        setLoading(false);
        setMounted(true);
      });
  }, []);

  /**
   * THEME TOGGLE HANDLER
   * Toggles between light and dark mode
   * - Updates state
   * - Updates DOM class
   * - Persists preference to localStorage
   */
  const toggleTheme = () => {
    // Toggle between light and dark
    const newTheme = theme === 'light' ? 'dark' : 'light';

    // Update state
    setTheme(newTheme);

    // Update HTML element class (Tailwind uses this)
    document.documentElement.classList.toggle('dark', newTheme === 'dark');

    // Persist to localStorage
    localStorage.setItem('theme', newTheme);
  };

  // LOADING STATE
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="animate-pulse text-gray-500">Loading board...</div>
      </div>
    );
  }

  // ERROR STATE
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="text-red-500 text-xl font-semibold mb-2">Failed to load board</div>
          <div className="text-gray-600 dark:text-gray-400">{error}</div>
        </div>
      </div>
    );
  }

  if (!boardData) {
    return null;
  }

  // MAIN RENDER
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/*
        HEADER SECTION
        - Semi-transparent with backdrop blur (glassmorphism effect)
        - Sticky positioning keeps it at top when scrolling
        - z-50 ensures it stays above other content
      */}
      <header className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LEFT SIDE: Logo and Title */}
            <div className="flex items-center space-x-3">
              {/* Logo Icon - Clipboard graphic */}
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              {/*
                Title with gradient text effect
                bg-clip-text + text-transparent creates gradient text
              */}
              <h1 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Task Board
              </h1>
            </div>

            {/* RIGHT SIDE: Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200 group"
              aria-label="Toggle theme"
            >
              {/* Container for overlapping icons */}
              <div className="relative w-6 h-6">
                {/*
                  SUN ICON (visible in light mode)
                  - absolute positioning allows icons to overlap
                  - opacity and rotation controlled by theme state
                  - smooth transition between states
                */}
                <svg
                  className={`absolute inset-0 w-6 h-6 text-amber-500 transition-all duration-300 ${theme === 'light' ? 'opacity-100 rotate-0' : 'opacity-0 rotate-90'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
                {/*
                  MOON ICON (visible in dark mode)
                  - Same positioning as sun icon
                  - Opposite opacity behavior
                */}
                <svg
                  className={`absolute inset-0 w-6 h-6 text-slate-400 transition-all duration-300 ${theme === 'dark' ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/*
        MAIN CONTENT AREA
        - max-w-7xl centers content with max width
        - Responsive padding (smaller on mobile, larger on desktop)
        - Contains the Board component with all columns
      */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/*
          Board Component
          - Pass down boardData state
          - Pass down setBoardData to allow child to update state
          - This is "lifting state up" pattern in React
        */}
        <Board boardData={boardData} setBoardData={setBoardData} />
      </main>
    </div>
  );
}
