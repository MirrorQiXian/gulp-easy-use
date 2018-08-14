module.exports ={
  srcPath:'src',
  build:{
    cssmin:true,
    jsmin:true,
    htmlmin:true,
    base64: 4 * 1024, // (bytes) 使用css中图片使用相对路径，否者无效
    versionHash: true, // 版本hash

  }
}