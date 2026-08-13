/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        warsgate: {
          50: '#fff1f2',
          100: '#ffe4e6',
          200: '#fecdd3',
          500: '#f43f5e',
          600: '#e11d48',
          700: '#be123c',
          800: '#9f1239',
          900: '#881337',
          950: '#4c0519',
        },
        mc: {
          light: '#fff1f2',
          DEFAULT: '#e11d48',
          dark: '#9f1239',
        },
        ee: {
          light: '#fffbebe',
          DEFAULT: '#d97706',
          dark: '#92400e',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Kanit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
