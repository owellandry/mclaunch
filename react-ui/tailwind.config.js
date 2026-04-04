/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#151515',
        surface: '#1F1F1F',
        surfaceLight: '#2a2a2a',
        primary: '#A1E9A5',
        primaryHover: '#8ad18e',
        secondary: '#D84136',
        textMain: '#FFFFFF',
        textMuted: '#a1a1aa',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
