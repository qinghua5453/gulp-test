var fs = require('fs');
var gulp = require('gulp');
const change = require('gulp-change');
const jsonFormat = require('json-format');

// target 目录匹配写法过于复杂，而且会把json之前所在的原有目录
// var target = ['./weixin3/pages/**/*.json', './weixin3/pay/**/*.json', './weixin3/reservation/**/*.json']
let destH5 = './weixin3'
let projectDir = [
    destH5 + '/**/*.json',
    '!' + destH5 + '/components',
    '!' + destH5 + 'components/**/*',
    '!' + destH5 + '/node_modules',
    '!' + destH5 + 'node_modules/**/*',
  ];
gulp.src(projectDir)
    //  .pipe(change((content) => {
    //     let filePath = this.file.history[0];
    //     filePath = filePath.replace(destH5 + '/', '').replace('.json', '');
    //     if (pages.indexOf(filePath) !== -1) {
    //       let obj = JSON.parse(content);
    //       if (!obj.pullRefresh) {
    //         obj.pullRefresh = false;
    //       }
    //       let config = {
    //         type: 'space',
    //         size: 4,
    //       };
    //       let result = jsonFormat(obj, config);
    //       return result;
    //     }
    //     return content;
    //  }))
     .pipe(gulp.dest('dist'))
     .on('end', (data) => {
       console.log('data', data)
     })