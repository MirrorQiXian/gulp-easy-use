const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
const chokidar = require('chokidar')
const del = require('del')
const gulpIf = require('gulp-if')
const fs = require('fs')
const config = require('./config')
if (!config.build) config.build = {}

const middleware = config.proxyTable && Object.prototype.toString.call(config.proxyTable) === '[object Object]' ? Object.keys(config.proxyTable).map(key => proxyMiddleware(key, typeof config.proxyTable[key] === 'string' ? { target: config.proxyTable[key] } : config.proxyTable[key])) : []

// 静态服务器 + 监听 scss/html 文件
gulp.task('dev', function () {
  browserSync.init({
    server: config.srcPath,
    middleware,
    port: 9000,
    online: false,
  })
  chokidar.watch(config.srcPath, { ignoreInitial: true, ignorePermissionErrors: true }).on('all', function (event) {
    if (['change', 'unlink'].indexOf(event) !== -1) {
      console.log('chokidar')
      reload()
    }
  })
})


// build
gulp.task('build', ['del_dist', 'copy', 'build_css', 'build_js', 'imgmin'], function () {
  gulp.start('build_html') // 必须在build_css build_js 之后执行 替换文件
})

gulp.task('del_dist', function () {
  del.sync('dist')
})
// 版本hash构建
const rev = require('gulp-rev')

const base64 = require('gulp-base64')
const postcss = require('gulp-postcss')
const cleanCSS = require('gulp-clean-css')
gulp.task('build_css', function () {
  return gulp.src([`${config.srcPath}/**/*.css`, `!${config.srcPath}/**/*.min.css`])
    .pipe(gulpIf(!!config.build.base64, base64({ maxImageSize: config.build.base64 })))
    .pipe(postcss())
    .pipe(gulpIf(config.build.cssmin, cleanCSS({ rebase: false })))
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-css.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})

const uglify = require('gulp-uglify')
gulp.task('build_js', function () {
  return gulp.src([`${config.srcPath}/**/*.js`, `!${config.srcPath}/**/*.min.js`])
    // .pipe(gulpIf(config.babel, babel()))
    .pipe(gulpIf(config.build.jsmin, uglify({ mangle: { reserved: ['require'] } })))   // seajs 模块 保留require关键词
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-js.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})

const prefix = require('gulp-prefix')
const htmlmin = require('gulp-htmlmin')
const htmlminConfig = {
  // removeComments: true,//清除HTML注释
  collapseWhitespace: true, // 压缩HTML
  // collapseBooleanAttributes: true,//省略布尔属性的值 <input checked='true'/> ==> <input />
  // removeEmptyAttributes: true,//删除所有空格作属性值 <input id='' /> ==> <input />
  // removeScriptTypeAttributes: true,//删除<script>的type='text/javascript'
  // removeStyleLinkTypeAttributes: true,//删除<style>和<link>的type='text/css'
  minifyJS: true, // 压缩页面JS
  minifyCSS: true// 压缩页面CSS
}
const revReplace = require('gulp-rev-replace')

gulp.task('build_html', function () {
  let manifestJs
  let manifestCss
  if (config.build.versionHash) {
    manifestJs = gulp.src('rev-manifest-js.json')
    manifestCss = gulp.src('rev-manifest-css.json')
  }
  return gulp.src([`${config.srcPath}/**/*.html`])
    .pipe(gulpIf(!!config.build.cdn, prefix(config.build.cdn, null)))
    .pipe(gulpIf(config.build.htmlmin, htmlmin(htmlminConfig)))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestJs })))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestCss })))
    .pipe(gulp.dest('dist'))
})


// 图片压缩
const imagemin = require('gulp-imagemin')
const mozjpeg = require('imagemin-mozjpeg')
const pngquant = require('imagemin-pngquant')
const cache = require('gulp-cache') // 缓存压缩图片，避免重复压缩

gulp.task('imgmin', function () {
  gulp.src(`${config.srcPath}/**/*.{jpg,jpeg,png}`)
    .pipe(cache(imagemin([mozjpeg({ quality: 70 }), pngquant({ quality: 70 })])))
    .pipe(gulp.dest('dist'))
})

gulp.task('copy', function () {
  gulp.src([`${config.srcPath}/**/*.min.css`, `${config.srcPath}/**/*.min.js`,`${config.srcPath}/**/*.min.js`,`${config.srcPath}/**/*.{ico,woff2,eot,ttf,otf,mp4,webm,ogg,mp3,wav,flac,aac}`])
    .pipe(gulp.dest('dist'))
})

gulp.task('start', function () {
  browserSync.init({
    server: {
      baseDir: ['dist'],  // 设置服务器的根目录
    },
    middleware,
    port: 8888,
    online: false,
    snippetOptions: {
      ignorePaths: ['/', '/**/*.html'], // 不对任何html进行注入，可以通过是否注入判断是否在 开发模式下
    }
  })
})

// 一个命令兼容webp

gulp.task('webp', ['generateWebp', 'webpcss', 'webphtml'])
const generateWebp = require('gulp-webp')
gulp.task('generateWebp', function () {
  gulp.src('dist/**/*.{png,jpg,jpeg}')
    .pipe(generateWebp())
    .pipe(gulp.dest('./dist'))
})

const webpcss = require('gulp-webpcss')
const cssnano = require('gulp-cssnano')
gulp.task('webpcss', function () {
  gulp.src('dist/**/*.css')
    .pipe(webpcss({
      webpClass: '.__webp__',
      replace_from: /\.(png|jpg|jpeg)/,
      replace_to: '.webp',
    }))
    .pipe(cssnano())
    .pipe(gulp.dest('./dist'))
})

const cheerio = require('gulp-cheerio')
gulp.task('webphtml', function () {
  return gulp
    .src('dist/**/*.html')
    .pipe(cheerio(function ($, file) {
      // 插入webp.js

      var webpJs = fs.readFileSync('__webp__.js', 'utf-8')
      $('head').append(`<script id="__webp__">${webpJs}</script>`)

      $('img[src]:not(.not-webp)').each(function () {
        var imgEl = $(this)
        var src = imgEl.attr('src')
        if (/^http/.test(src)) return
        imgEl.css('visibility','hidden')
        imgEl.removeAttr('src')
        imgEl.attr('data-src', src)
        
      })

      if ($('#__webp__').length > 0) return
    }))
    .pipe(gulp.dest('dist'))
})


//  雪碧图
const spritesmith = require('gulp.spritesmith')
gulp.task('sp', function () {
  // 读取 sprites
  let spritesList = fs.readdirSync('sprites')
  let sprites = gulp.src('sprites/*/*.{jpg,png}')
  spritesList.forEach((spritesItem) => {
    sprites = sprites.pipe(gulpIf(`${spritesItem}/*.{jpg,png,svg}`, spritesmith({
      imgName: spritesItem + '.png',
      cssName: spritesItem + '.css',
      cssTemplate: 'sprites-css.handlebars',
      imgPath: `./${spritesItem}.png`
    })))
  })
  return sprites.pipe(gulp.dest(config.spritesPath || `${config.srcPath}/sprites/`))
})