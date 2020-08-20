/**
 * 配置工具类
 */
class Config {
  constructor() {
    this.isInit = false;
    this.env = null; // 小程序当前运行的版本，枚举类型：develop（开发版）、trial（体验版）、release（发布版）
    this.config = null;
  }

  // 初始化配置
  get() {
    if (this.isInit) {
      return this.config;
    }

    // 初始化配置
    let baseConfig = require('../config/base.env');
    let envConfig = null;
    this.env = 'release';
    switch (this.env) {
      case 'develop':
        envConfig = require('../config/develop.env');
        break;
      case 'trial':
        envConfig = require('../config/trial.env');
        break;
      default:
        envConfig = require('../config/release.env');
        break;
    }
    let config = Object.assign(baseConfig, envConfig);
    config.debug = config.DEBUG;
    config.baseurl = config.API_URL;
    config.imgUrl = config.IMG_URL;
    this.config = config;
    this.isInit = true;
    return this.config;
  }
}

const con = new Config();

export default con;