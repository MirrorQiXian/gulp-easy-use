module.exports = {
  srcPath: 'src', // 项目源目录
  spritesPath: 'src/sprites', // 雪碧图生成的目标目录
  build: {
    cssmin: true,
    jsmin: true,
    htmlmin: true,
    base64: 4 * 1024, // (bytes) 使用css中图片使用相对路径，否者无效
    versionHash: true, // 版本hash
  },
  // proxyTable: {
  //   '/api': 'http://localhost:3000',
  //   '/hehe': {
  //     target: 'http://localhost:3000',
  //     pathRewrite: {
  //       // 地址重写
  //       '^/hehe': '/api'
  //     }
  //   }
  // }
}