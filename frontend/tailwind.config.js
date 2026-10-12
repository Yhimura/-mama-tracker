/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pastel Motherhood Palette
        rose: {
          50: '#fff5f7',
          100: '#ffe4e9',
          200: '#fecdd7',
          300: '#fda4b8',
          400: '#fb7193',
          500: '#f43f6e',
        },
        lavender: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
        },
        peach: {
          50: '#fff8f3',
          100: '#ffede1',
          200: '#fedbc4',
          300: '#fdbf98',
          400: '#f99961',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e4ebe4',
          200: '#cbd8cb',
          300: '#a6bea6',
          400: '#7e9f7e',
          500: '#5e825e',
        },
        cream: {
          50: '#fdfbf7',
          100: '#fbf7ee',
          200: '#f5edd9',
        }
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(244, 63, 110, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 8px 30px -4px rgba(168, 85, 247, 0.06), 0 4px 10px -2px rgba(0, 0, 0, 0.03)',
        'button': '0 6px 20px -2px rgba(244, 63, 110, 0.35)',
      },
      borderRadius: {
        '3xl': '1.75rem',
      }
    },
  },
  plugins: [],
}
