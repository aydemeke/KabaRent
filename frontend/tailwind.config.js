/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary':                   '#1C7C49',
        'secondary':                 '#FFC233',
        'tertiary':                  '#E24A3B',
        'secondary-container':       '#FFC233',
        'accent-gold':               '#FFC233',
        'accent-red':                '#E24A3B',
        'accent-red-text':           '#B5392D',
        'surface':                   '#FDFBF5',
        'surface-container-lowest':  '#FFFFFF',
        'surface-container-low':     '#F8F3E7',
        'surface-container':         '#F3ECD9',
        'surface-container-high':    '#ECE4CB',
        'surface-container-highest': '#E4DABB',
        'on-surface':                '#1C1B16',
        'on-surface-variant':        '#5A5443',
        'outline-variant':           '#ECE4CB',
      },
      fontFamily: {
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
        inter:   ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'ambient':    '0 2px 16px rgba(28,124,73,0.06)',
        'ambient-md': '0 6px 24px rgba(28,124,73,0.09)',
        'ambient-lg': '0 12px 32px rgba(28,124,73,0.12)',
        'nav':        '0px 12px 32px rgba(28,124,73,0.05)',
      },
    },
  },
  plugins: [],
}
