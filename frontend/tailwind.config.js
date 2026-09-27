/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          200: '#c3d9eb',
          300: '#95bde0',
          400: '#619dd1',
          500: '#3d81be',
          600: '#2c66a0',
          700: '#245182',
          800: '#1e426b',
          900: '#1a3758',
          950: '#112338',
        }
      }
    },
  },
  plugins: [],
}
