const { defineConfig } = require('@vue/cli-service')
const { ElementPlusResolver } = require('unplugin-vue-components/resolvers')
const AutoImport = require('unplugin-auto-import/webpack')
const Components = require('unplugin-vue-components/webpack')
module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave:false,
  publicPath: '/yunshenNav/',
  configureWebpack: {
    devServer:{
      client:{overlay:false}
    },
    plugins: [
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
      }),
    ],
  },
})
