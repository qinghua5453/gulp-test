/*
 * @Author: your name
 * @Date: 2020-08-13 18:26:08
 * @LastEditTime: 2020-08-17 16:11:34
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
        .pipe(gulp.dest('dist-webp'))
        .on('end', () => {
          eventStream2()
          console.log('img convert done!');
          cb && cb()
        })
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
  const result = webp.dwebp('/Users/zhangjian/gulp-test/my-project/images/7601wh12000.jpg', '/Users/zhangjian/gulp-test/my-project/images/7601wh12000.webp', '-q 80')
  result.then((response) => {
  console.log(response);
  }).catch(err => {
    console.log('----------------err-------------------', err)
  })
  return
  fs.readdir('./images', 'utf8', (err, files) => {
    if (err) {
      console.log('err', err);
      return
    }
    // console.log('__dirname', __dirname)
    // let filePath = path.join(__dirname, 'images')
    // let filePath2 = path.resolve(__dirname, 'images')
    // console.log('filePath', filePath)
    // console.log('filePath2', filePath2)
    // console.log('__filename', __filename)

    // console.log('files', files)
    files.forEach((item) => {
      if (/\.(jpeg|jpg|png)/ig.test(item)) {
        let fileName = item.replace(/\.(jpeg|jpg|png)/ig, '');
        console.log('fileName', fileName)
        // const result = webp.dwebp(`${__dirname}/images/${item}`, `${__dirname}/images/${fileName}.webp`, '-q 80')
        const result = webp.dwebp('/Users/zhangjian/gulp-test/my-project/images/免费恰饭@3x.png', '/Users/zhangjian/gulp-test/my-project/images/免费恰饭@3x.webp', '-q 80')
        result.then((response) => {
         console.log(response);
        }).catch(err => {
          console.log('----------------err-------------------', err)
        })
      }
    })
    // let fileDir = path.dirname('./images/7601.jpg_wh12000.jpg')
    // console.log('fileDir', fileDir)
    // const result = webp.gwebp("./images/7601.jpg_wh12000.jpg", "./images/7601.jpg_wh12000.webp", "-q 80");
    // result.then((response) => {
    //   console.log(response);
    // });
  })
}

// exports.imgToWebp = imgToWebp;