/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        coffee: {
          50: '#FDF8F5',
          100: '#F7EDE6',
          200: '#EBD8CB',
          300: '#D7BCAB',
          400: '#B89379',
          500: '#946B50',
          600: '#7B523B',
          700: '#5F3D2A',
          800: '#482D1F',
          900: '#321E14',
          950: '#1C0F0A',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E6EFE5',
          500: '#487346',
          600: '#355933',
          700: '#274426',
        }
      },
      fontSize: {
        'touch-sm': '1.125rem',  // 18px
        'touch-base': '1.25rem',  // 20px
        'touch-lg': '1.5rem',     // 24px
        'touch-xl': '1.875rem',  // 30px
        'touch-2xl': '2.25rem',  // 36px
        'touch-3xl': '3rem',     // 48px
      },
      minHeight: {
        'touch': '56px',
        'touch-lg': '64px',
      },
      minWidth: {
        'touch': '56px',
        'touch-lg': '64px',
      }
    },
  },
  plugins: [],
}
