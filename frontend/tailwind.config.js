/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-serif)'],
        sans:  ['var(--font-sans)'],
        mono:  ['var(--font-mono)'],
      },
    },
  },
  plugins: [],
}
