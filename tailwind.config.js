/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          50:  '#fdfaf5',
          100: '#faf4e8',
          200: '#f4e9d0',
          300: '#ead8b4',
          400: '#d9be8a',
          500: '#c9a563',
        },
        stone: {
          750: '#3a3530',
        }
      },
      fontFamily: {
        sans: ['Gabarito', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
