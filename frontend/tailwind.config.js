/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101827',
        muted: '#667085',
        brand: { 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366f1', 600: '#5458e8', 700: '#4646c7' },
      },
      boxShadow: {
        soft: '0 8px 30px rgba(16, 24, 40, 0.055)',
        panel: '0 2px 10px rgba(16, 24, 40, 0.035), 0 16px 40px rgba(16, 24, 40, 0.035)',
      },
    },
  },
  plugins: [],
};
