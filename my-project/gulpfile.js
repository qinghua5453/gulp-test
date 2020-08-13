#!/usr/bin/env node

const program = require('commander');
const imagemin  = require('./libs/imagemin')

program.version('1.1.5', '-v, --version');

program
  .command('imgmin')
  .description('优化图片压缩，减小图片大小')
  .action(() => {
    console.log('图片正则压缩中....')
    imagemin();
  });

program
  .command('uploadImage')
  .description('批量上传图片，参数-d 指定文件上传目录')
  .option('-d, --dest [dest]', 'define destination file path')
  .action(() => {
    console.log('1111')
  });

program
  .command('transToWechat')
  .description('支付宝小程序转微信小程序')
  .action(() => {
    console.log('2222')
  });

program
  .command('cleanVue')
  .description('支付宝小程序转vue后，清除多余的axml,acss,sjs,json,jsx等文件')
  .action(() => {
    console.log('3333')
  });

program
  .command('cleanWechat')
  .description('支付宝小程序转wechat后，清除多余的axml,acss,sjs,json,jsx等文件')
  .action(() => {
    console.log('4444')
  });

program.parse(process.argv);
