/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './**/*.html',
    './**/*.js'
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          deep: '#fbebcc',
          card: '#4A5450',
          light: '#E0E2DB',
          accent: '#F58220',
          secondary: '#5A6560',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'serif'],
      },
    },
  },
  plugins: [],
};
