/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#0EA5A5',
          'teal-dark': '#0C8C8C',
          'teal-light': '#E6F7F7',
          coral: '#FF6B5A',
          'coral-dark': '#E85A4A',
          'coral-light': '#FFF0EE',
          gold: '#F5A623',
          ink: '#1A1A2E',
          'ink-light': '#4A4A5E',
          'ink-muted': '#8888A0',
          bg: '#FFFFFF',
          'bg-warm': '#FAFAF8',
          border: '#E8E8EE',
          'border-light': '#F2F2F6',
        },
      },
      fontFamily: {
        display: ['Baloo 2', 'cursive'],
        body: ['Nunito', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
