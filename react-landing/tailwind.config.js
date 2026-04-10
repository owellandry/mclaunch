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
      keyframes: {
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        scroll_reverse: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      animation: {
        'scroll_20s_linear_infinite': 'scroll 20s linear infinite',
        'scroll_30s_linear_infinite_reverse': 'scroll_reverse 30s linear infinite',
        'scroll_40s_linear_infinite': 'scroll 40s linear infinite',
      }
    },
  },
  plugins: [],
}
