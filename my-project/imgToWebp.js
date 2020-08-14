/*
 * @Author: your name
 * @Date: 2020-08-13 18:26:08
 * @LastEditTime: 2020-08-14 15:45:46
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini_tool/Users/zhangjian/gulp-test/my-project/test2.js
 */
var { exec } = require('child_process');
const webp = require('webp-converter');
const es = require('event-stream');
const path = require('path');
const gulp = require('gulp');
const fs = require('fs');

// exec('pwd', (err, stdout, stderr) => {
//     if(err) {
//         console.error('error: ' + err);
//         return;
//     }
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + typeof stderr);
// })

function imgToWebp (cb) {
  return gulp.src('./images/*.+(jpg|png)')
        // .pipe(eventStream2())
        // dest代码无效？？？？
        // .pipe(gulp.dest('dist-webp'))
        // .on('end', () => {
        //   console.log('img convert done!');
        //   cb && cb()
        // })
}

imgToWebp();

function eventStream () {
  return es.map(async (file, cb) => {
    //   console.log('file', file);
      let filename = file.basename,
      fname,
      fileDir = path.dirname(file.path);
      console.log('file.path', file.path)
      // fileDir = path.dirname('dist-webp')
      // console.log('filename', filename)
    //   console.log('fileDir', fileDir)
      // console.log('path', file.path)
      if (/\b\.gif$/g.test(filename)) {
        fname = filename.replace(/\.gif/g, '');
        await webp.gwebp(
          fileDir + '/' + filename,
          fileDir + '/' + fname + '.webp',
          '-q 80'
        );
      } else {
        fname = filename.replace(/\.(png|jpg|jpeg)/g, '');
        await webp.cwebp(
          fileDir + '/' + filename,
          fileDir + '/' + fname + '.webp',
          '-q 80'
        );
      }
      cb && cb()
  })
}

function eventStream2 () {
  fs.readdir('./images', 'utf8', (err, data) => {
    if (err) {
      console.log('err', err);
      return
    }
    console.log('data', data)
  })
}

// exports.imgToWebp = imgToWebp;