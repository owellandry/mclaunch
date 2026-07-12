/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#08100C',
        surface: '#070D0F',
        surfaceLight: '#0E171B',
        primary: 'var(--color-primary)',
        primaryHover: 'var(--color-primary-hover)',
        primaryShadow: 'var(--color-primary-shadow)',
        secondary: '#ff3b5c',
        textMain: '#F5F7F7',
        textMuted: '#A8B3B5',
        line: '#294047',
        panel: '#070D0F',
        panel2: '#0E171B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Anton', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        // Match dashboard chrome (search, panels, pills stay rounded-lg/full)
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
