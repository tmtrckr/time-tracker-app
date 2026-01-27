/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./frontend/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        work: '#4CAF50',
        communication: '#2196F3',
        meetings: '#9C27B0',
        browser: '#FF9800',
        entertainment: '#F44336',
        thinking: '#00BCD4',
        break: '#795548',
        uncategorized: '#9E9E9E',
      },
    },
  },
  plugins: [],
}
