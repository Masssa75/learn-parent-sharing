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
        'dark-bg': '#000000',
        'dark-surface': '#1a1a1a',
        'dark-border': '#333333',
        'brand-yellow': '#F5D547',
        'brand-green': '#1DB954',
        'text-primary': '#ffffff',
        'text-secondary': '#888888',
        'text-muted': '#666666',
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', fontWeight: '700' }],
        'title-lg': ['36px', { lineHeight: '1.2', fontWeight: '700', letterSpacing: '-1px' }],
        'title': ['24px', { lineHeight: '1.3', fontWeight: '600' }],
        'body-lg': ['18px', { lineHeight: '1.5' }],
        'body': ['16px', { lineHeight: '1.5' }],
        'meta': ['14px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        'button': '25px',
        'card': '16px',
        'input': '12px',
        'avatar': '12px',
        'fab': '20px',
      },
      borderWidth: {
        '3': '3px'
      },
    },
  },
  plugins: [],
}