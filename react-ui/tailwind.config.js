/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#e5e5e5', // Light stone gray
        surface: '#f4f4f5', // Nearly white
        surfaceLight: '#d4d4d8', // Gray for borders/accents
        primary: 'var(--color-primary)', 
        primaryHover: 'var(--color-primary-hover)',
        primaryShadow: 'var(--color-primary-shadow)',
        secondary: '#ef4444', // Red
        textMain: '#18181b', // Dark gray almost black
        textMuted: '#52525b', // Medium gray
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
