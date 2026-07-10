/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0f0f14',
        surface: '#18181f',
        surfaceLight: '#252532',
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        primaryShadow: 'var(--color-primary-shadow)',
        secondary: '#ff3b5c',
        textMain: '#f1f1f6',
        textMuted: '#8b8ba0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
