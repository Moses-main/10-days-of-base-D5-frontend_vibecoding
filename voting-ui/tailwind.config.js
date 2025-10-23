/********************
 Tailwind CSS Config
********************/
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: '#0052FF',
          50: '#E6EEFF',
          100: '#CCDFFF',
          200: '#99BFFF',
          300: '#669FFF',
          400: '#337FFF',
          500: '#0052FF',
          600: '#0043CC',
          700: '#003399',
          800: '#002366',
          900: '#001233',
        },
      },
      boxShadow: {
        soft: '0 10px 30px -10px rgba(0,0,0,0.35)',
        glow: '0 0 30px rgba(0, 82, 255, 0.35)'
      },
      borderRadius: {
        xl: '1rem',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
}
