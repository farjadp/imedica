/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf8',
          100: '#dcfcf0',
          200: '#bbf7e0',
          300: '#86efca',
          400: '#4ade9e',
          500: '#22c574',
          600: '#16a35c',
          700: '#15804a',
          800: '#166640',
          900: '#145437',
          950: '#052e1e',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
