# gulp-easy-use
传统项目专用（指直接使用html，css，js书写的项目），直接复制到src目录即可享受以下功能

如果你想要使用 babel，scss，pug，你可以看这个项目[gulp-easy](https://github.com/lfyfly/gulp-easy)

## 功能简介
详见配置文件根目录`config.js`
### 开发
- 新增文件，文件变动自动刷新
- 代理配置
### 打包
- postcss
- 小图转base64
- cdn路径
- html,css,js压缩
- 版本hash
- proxy


## 2、如何使用
### 2.1 下载项目
 （1） `git clone https://github.com/lfyfly/gulp-easy-use.git`或者下载 `zip包`
 
 （2）删除项目下的因此目录`.git`文件夹，这是我的commit记录，所以删除

 （3）`npm install` 安装依赖

 （4）`npm run dev`

### 2.2 命令
### `npm run dev`
进入开发模式

### `npm run build`
打包命令

### `npm run start`
打包并且以`dist`为根目录开启服务器查看效果

### `npm run sp`
把根目录下的sprites文件夹下的子目录内的所有文件夹中的png和jpg的图片，以子文件夹目录为单位生产雪碧图，文件名为子目录名

### webp支持，在执行完`npm run build`后执行`npm run webp`
#### 默认情况下html中的`img[src]`会被处理成`img[data-src]`
- 当img的src为`http`开头则会被忽略该处理
- 当img的className中包含`not-webp`开头则会被忽略该处理
