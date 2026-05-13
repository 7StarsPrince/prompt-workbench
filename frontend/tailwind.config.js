/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E3120B',
        secondary: '#333333',
        surface: '#F4F4F4',
      }
    },
  },
  plugins: [],
}
