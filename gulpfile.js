const gulp = require('gulp')
const browserSync = require('browser-sync').create()
const reload = browserSync.reload
const chokidar = require('chokidar')
const del = require('del')
const gulpIf = require('gulp-if')

const config = require('./config')
if(!config.build) config.build = {} 
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


gulp.task('build', ['del_dist', 'build_css', 'build_js', 'build_html' ,'imgmin'])

gulp.task('del_dist', function () {
  del.sync('dist')
})

const base64 = require('gulp-base64')
const postcss = require('gulp-postcss')
const cleanCSS = require('gulp-clean-css')
gulp.task('build_css', function () {
  return gulp.src([`${config.srcPath}/**/*.css`])
    .pipe(gulpIf(!!config.build.base64, base64({ maxImageSize: config.build.base64 })))
    .pipe(postcss())
    .pipe(gulpIf(config.build.cssmin, cleanCSS({ rebase: false })))
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-css.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})

const rev = require('gulp-rev')
gulp.task('build_js', function () {
  return gulp.src([`${config.srcPath}/**/*.js`, `!${config.srcPath}/static/_vendor/**/*.js`])
    .pipe(gulpIf(config.build.jsSourcemap, sourcemaps.init()))
    .pipe(gulpIf(config.babel, babel()))
    .pipe(gulpIf(config.build.jsmin, uglify({ mangle: { reserved: ['require'] }})))   // seajs 模块 保留require关键词
    .pipe(gulpIf(config.build.versionHash, rev()))
    .pipe(gulpIf(config.build.jsSourcemap, sourcemaps.write('/maps')))
    .pipe(gulp.dest('dist'))
    .pipe(gulpIf(config.build.versionHash, rev.manifest('rev-manifest-js.json')))
    .pipe(gulpIf(config.build.versionHash, gulp.dest('')))
})

gulp.task('build_html', function () {
  let manifestJs
  let manifestCss
  if (config.build.versionHash) {
    manifestJs = gulp.src('rev-manifest-js.json')
    manifestCss = gulp.src('rev-manifest-css.json')
  }
  return gulp.src([`${config.srcPath}/**/*.html`, `!${config.srcPath}/static/_vendor/**/*.html`].concat(config.pug ? [`${config.srcPath}/**/*.pug`, `!${config.srcPath}/_pug/**/*.pug`, `!${config.srcPath}/_modules/**/*.pug`] : []))
    .pipe(gulpIf(config.pug, pug({ pretty: true })))
    .pipe(gulpIf(!!config.build.cdn, prefix(config.build.cdn, null)))
    .pipe(gulpIf(config.build.htmlmin, htmlmin(htmlminConfig)))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestJs })))
    .pipe(gulpIf(config.build.versionHash, revReplace({ manifest: manifestCss })))
    .pipe(gulp.dest('dist'))
})


// 图片压缩
// const imagemin = require('gulp-imagemin')
// const mozjpeg = require('imagemin-mozjpeg')
// const pngquant = require('imagemin-pngquant')
// const cache = require('gulp-cache') // 缓存压缩图片，避免重复压缩

// gulp.task('imgmin', function () {
//   gulp.src(`${config.srcPath}/**/*.{jpg,jpeg,png}`)
//     .pipe(cache(imagemin([mozjpeg({ quality: 70 }), pngquant({ quality: 70 })])))
//     .pipe(gulp.dest('dist'))
// })

gulp.task('start', ['build'], function () {
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
