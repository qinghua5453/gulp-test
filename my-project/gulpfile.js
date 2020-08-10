/*
 * @Author: your name
 * @Date: 2020-07-31 17:06:02
 * @LastEditTime: 2020-08-10 11:15:14
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini-alipay-new/Users/zhangjian/gulp-test/my-project/gulpfile.js
 */ 
const { series, src, dest } = require('gulp');
const  { EventEmitter } = require('events');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path')
const program = require('commander');

function streamTask(cb) {

   // src('*.js')
   //  .pipe(dest('output'));

   // fs.mkdir('components3/adver/js', {recursive: true}, (err) => {
   //    if (err) {
   //       throw err;
   //    }
   // })
   
   // fs.readdir('output', (err, files) => {
   //    if (err) throw err;
   //    console.log(files)
   // })
   
   // fs.readFile('output/.js', 'utf8', (err, data) => {
   //    if (err) throw err;
   //    console.log(data);
   // })
   
   // fs.writeFile('output/j.js', '这是我新写入的', (err) => {
   //    if (err) throw err;
   //    console.log('文件已被写入')
   // })

   // fs.appendFile('output/j.js', '妈的，刚写的文件被覆盖了，我重新又写了一条', (err) => {
   //    if (err) throw err;
   //    console.log('文件再一次被写入')
   // })

   // fs.rmdir('output', (err) => {
   //    if (err) throw err;
   //    console.log('文件被删除')
   // })

   // fs.stat('./test.js', (err, data) => {
   //    if (err) throw err;
   //    console.log(data.isDirectory())
   // })

   // fs.rename('./test1-new.js', './js/test1-new.js', (err) => {
   //    if (err) throw err;
   // })
   
   // console.log(__dirname)
   // console.log(__filename)
   // let str = path.resolve('test/j', 'com')
   // console.log(str)
   // program.version('1.1.0', '-v, --version');
   console.log('------')
}
  
exports.default = streamTask
