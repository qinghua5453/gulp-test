/*
 * @Author: your name
 * @Date: 2020-08-11 11:30:00
 * @LastEditTime: 2020-08-11 19:33:23
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini_tool/Users/zhangjian/gulp-test/my-project/libs/imagemin.js
 */
const { src, dest } = require('gulp');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const image = require('gulp-image');

let currentDir = process.cwd();
console.log('currentDir------', currentDir);
let imgArray = [
  './**/*.+(png|jpg|jpeg|gif)',
  '!./node_modules/**/*.+(png|jpg|jpeg|gif)',
];

// png 无法压缩????
const imagemin = (calc) => {
    src(imgArray, { base: currentDir })
      .pipe(
        plumber({
          errorHandler: (err) => {
            notify.onError({
              title: 'Gulp error in ' + err.plugin,
              message: err.toString(),
            })(err);
          },
        })
      )
      .pipe(
        image({
          concurrent: 2,
        })
      )
      .pipe(dest(currentDir))
      .on('end', () => {
        console.log('images min finished!');
        calc && calc();
      });
};

exports.imagemin = imagemin;
  