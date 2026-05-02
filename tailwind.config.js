/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#EEF7F5',
          100: '#D5EDE9',
          200: '#A9D9D1',
          300: '#74BDB2',
          400: '#4A9E93',
          500: '#2A8275',
          600: '#1A7A68',
          700: '#156354',
          800: '#124D42',
          900: '#0E3A31',
          950: '#081E19',
        },
        terra: {
          50: '#FDF4EC',
          100: '#FAE4CA',
          200: '#F4C490',
          300: '#ECA055',
          400: '#E38230',
          500: '#C97D3A',
          600: '#A3621E',
          700: '#7D4A14',
          800: '#5A3711',
          900: '#432B10',
        },
        semantic: {
          success: '#2E7D56',
          warning: '#C9870A',
          danger: '#C0392B',
          info: '#1A7A68',
        },
        dark: {
          bg: '#0D1F1B',
          card: '#1A3530',
          border: '#2A4540',
        },
      },
      fontFamily: {
        sans: ['"Atkinson Hyperlegible"', 'sans-serif'],
        heading: ['Sora', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
    },
  },
  plugins: [],
};