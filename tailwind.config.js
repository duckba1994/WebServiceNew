/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"IBM Plex Sans Thai"', 'Tahoma', '"Leelawadee UI"', 'sans-serif'],
      },
      colors: {
        // ปรับ palette ตามโปรเจกต์ใหม่ได้
        accent: {
          DEFAULT: '#1a5fb4',
          1: '#1a5fb4', // blue
          2: '#2d7d46', // green
          3: '#b45309', // amber
          4: '#5b3fa6', // purple
          5: '#9b3068', // pink
        },
      },
    },
  },
  plugins: [],
};
