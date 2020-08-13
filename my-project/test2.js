/*
 * @Author: your name
 * @Date: 2020-08-13 18:26:08
 * @LastEditTime: 2020-08-13 19:32:46
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath: /mini_tool/Users/zhangjian/gulp-test/my-project/test2.js
 */
var { exec } = require('child_process');
exec('pwd', (err, stdout, stderr) => {
    if(err) {
        console.error('error: ' + err);
        return;
    }
    console.log('stdout: ' + stdout);
    console.log('stderr: ' + typeof stderr);
})