module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
    //自定义媒体查询
    screens: {
      'sm': {'max': '599px'},
      'md': {'min': '600px', 'max': '1399px'},
      'lg': {'min': '1400px'},
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
