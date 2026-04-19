/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0a0a',
          elevated: '#141414',
          card: '#1c1c1c',
        },
        fg: {
          DEFAULT: '#f5f5f5',
          muted: '#a1a1aa',
          subtle: '#52525b',
        },
        accent: {
          DEFAULT: '#ef4444',
          dim: '#7f1d1d',
        },
        border: {
          DEFAULT: '#27272a',
        },
      },
      spacing: {
        '0.5g': '8px',
        '1g': '13px',
        '2g': '21px',
        '3g': '34px',
        '5g': '55px',
        '8g': '89px',
      },
      fontFamily: {
        mono: ['Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};
