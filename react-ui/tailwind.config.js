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
        surface: '#202020',
        surfaceLight: '#2a2a2a',
        primary: '#4ade80', // Minecraft green
        primaryHover: '#22c55e',
        secondary: '#3f3f46',
        textMain: '#ffffff',
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
