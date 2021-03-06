/*
 * @Author: your name
 * @Date: 2020-08-13 10:17:12
 * @LastEditTime: 2020-08-14 09:58:20
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini_tool/Users/zhangjian/gulp-test/my-project/test.js
 */
var gulp = require('gulp');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var image = require('gulp-image');
var fs = require('fs');
var jsonFormat = require('json-format');
var { resolve } = require('path');
var { exec } = require('child_process');
var del = require('del');


 function minImage () {
     return gulp.src('./images/**/*.+(jpg|png)')
         .pipe(imagemin({
             progressive: true,
             use: [pngquant()] //使用pngquant来压缩png图片
         }))
         .pipe(gulp.dest('dist'));
 }

 function minImage2 () {
    return gulp.src('./images/**/*.+(jpg|png)')
        .pipe(
          image({
            concurrent: 2,
          }))
        .pipe(gulp.dest('dist'))
        .on('end', async () => {
           let data = await readdir()
           let json = {}
            for (let i = 0; i < data.length; i++) {
              json[data[i]] = data[i]
            }
            fs.writeFile('./dist/mini_file.json', jsonFormat(json), (err) => {
              if (err) {
                console.log('err', err)
                return
              }
            })
        })
}
//  minImage()
minImage2()

function readdir () {
  return new Promise ((resolve, reject) => {
    fs.readdir('./dist', 'utf8', (err, data) => {
      if (err) {
        console.log('err', err)
        reject(err)
       return
      }
      resolve(data)
   })
  })
}
// gulp.task('image', () => {
//      gulp.src('./images/**/*.+(jpg|png)')
//          .pipe(imagemin({
//              progressive: true,
//              use: [pngquant()] //使用pngquant来压缩png图片
//          }))
//          .pipe(gulp.dest('dist'));
// })

// gulp.task('default', gulp.series('image'))
