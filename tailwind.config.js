/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-green': '#1DB954',
        'dark-bg': '#0F0F0F',
        'dark-surface': '#1A1A1A',
        'dark-border': '#2A2A2A',
      },
    },
  },
  plugins: [],
}