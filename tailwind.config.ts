import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        board: {
          bg: '#0d1117',
          'bg-light': '#f6f8fa',
        },
        column: {
          bg: '#161b22',
          'bg-light': '#ffffff',
          border: '#30363d',
          'border-light': '#d0d7de',
        },
        card: {
          bg: '#0d1117',
          'bg-light': '#ffffff',
          hover: '#161b22',
          'hover-light': '#f6f8fa',
        },
        priority: {
          low: '#2ea043',
          medium: '#fb8500',
          high: '#da3633',
        }
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config