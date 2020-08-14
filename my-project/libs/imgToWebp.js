/*
 * @Author: your name
 * @Date: 2020-08-14 14:56:26
 * @LastEditTime: 2020-08-14 14:59:09
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini_tool/Users/zhangjian/gulp-test/my-project/libs/imgToWebp.js
 */
const webp = require('webp-converter');
const es = require('event-stream');
const path = require('path');
const { src, dest } = require('gulp');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');

const convertImg = (imgArray, currentDir, calc) => {
  src(imgArray)
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
    .pipe(convertImgFile(es, webp))
    .pipe(dest(currentDir))
    .on('end', () => {
      console.log('img convert done!');
      calc && calc();
    });
};
const convertImgFile = (es, webp) => {
  return es.map(async (file, cb) => {
    let filename = file.basename,
      fname,
      flieDir = path.dirname(file.path),
      res;
    if (/\b\.gif$/g.test(filename)) {
      fname = filename.replace(/\.gif/g, '');
      await webp.gwebp(
        flieDir + '/' + filename,
        flieDir + '/' + fname + '.webp',
        '-q 80'
      );
    } else {
      fname = filename.replace(/\.(png|jpg|jpeg)/g, '');
      await webp.cwebp(
        flieDir + '/' + filename,
        flieDir + '/' + fname + '.webp',
        '-q 80'
      );
    }
    return cb(null, file);
  });
};
convertImg('./images/*.+(jpg|png)', 'dist-webp');
// exports.convertImg = convertImg;
