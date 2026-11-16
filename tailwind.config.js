/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./entrypoints/**/*.{html,ts,tsx}",
    "./components/**/*.{html,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          DEFAULT: '#08090D',
          card: '#0F121A',
          inner: '#151924',
        },
        cobalt: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
          light: '#60A5FA',
        },
        lime: {
          DEFAULT: '#CCFF00',
          hover: '#B8E600',
          dark: '#99CC00',
        },
      },
      boxShadow: {
        'glow-cobalt': '0 0 20px rgba(37, 99, 235, 0.4)',
        'glow-lime': '0 0 16px rgba(204, 255, 0, 0.35)',
      },
    },
  },
  plugins: [],
}
