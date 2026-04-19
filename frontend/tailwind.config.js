/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary':                   '#012d1d',
        'secondary':                 '#705d00',
        'tertiary':                  '#560000',
        'secondary-container':       '#fcd400',
        'surface':                   '#f9f9f8',
        'surface-container-lowest':  '#ffffff',
        'surface-container-low':     '#f3f4f3',
        'surface-container':         '#eeeeed',
        'surface-container-high':    '#e8e8e7',
        'surface-container-highest': '#e2e2e2',
        'on-surface':                '#1a1c1c',
        'on-surface-variant':        '#414844',
        'outline-variant':           '#c1c8c2',
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'ambient':    '0 2px 16px rgba(1,45,29,0.06)',
        'ambient-md': '0 6px 24px rgba(1,45,29,0.09)',
        'ambient-lg': '0 12px 32px rgba(1,45,29,0.12)',
        'nav':        '0px 12px 32px rgba(26,28,28,0.04)',
      },
    },
  },
  plugins: [],
}
