/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        amethyst: {
          950: '#0b0614',
          900: '#140c24',
          800: '#23143d',
          700: '#381c63',
          600: '#532991',
          500: '#753bca',
          400: '#9d63f4',
          300: '#c29bfa',
        },
        rosegold: {
          400: '#f0c6a5',
          500: '#e0a96d',
          600: '#c88a4c',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
