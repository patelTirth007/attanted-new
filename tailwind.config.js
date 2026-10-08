/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        college: {
          navy: '#0F172A',
          primary: '#1E40AF',
          'primary-light': '#3B82F6',
          secondary: '#0284C7',
          accent: '#4F46E5'
        }
      }
    },
  },
  plugins: [],
}
