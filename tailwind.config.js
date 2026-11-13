/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'sans-serif'],
        arabic: ['Amiri', 'Traditional Arabic', 'serif'],
        rapor: ['Times New Roman', 'Times', 'serif']
      }
    },
  },
  plugins: [],
}
