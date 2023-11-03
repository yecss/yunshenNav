/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    //自定义媒体查询
    screens: {
      'sm': {'max': '599px'},
      'md': {'min': '600px', 'max': '1399px'},
      'lg': {'min': '1400px'},
    },
  },
  plugins: [],
}

