import User from '../models/user';
import HttpErrorHandler from './HttpErrorHandler';
/**
 * 网络访问类
 */
const HTTP_TIMEOUT = 5000;

const Http = {
  isOpenCodeHandler: true,

  loadingTimer: null,

  app: null,

  /**
   * 通用的http请求方法
   *
   * @param {*} path 地址
   * @param {*} data 数据
   * @param {*} method 请求方式
   * @param {*} isOpenCodeHandler 是否开启http code自动错误码处理器，如果不开启，可以在catch中自定义处理
   */
  async fetch(path, data = {}, method = 'GET', isOpenCodeHandler = true) {
    const url = await this.filterPath(path);
    data = await this.filterData(data);
    this.isOpenCodeHandler = isOpenCodeHandler;
    try {
      this.showLoading();
      let res = await this.request({
        url,
        header: {
          'content-type': 'application/x-www-form-urlencoded',
          uid: User.getUid() || undefined,
        },
        method,
        data,
        timeout: HTTP_TIMEOUT,
      });
      this.hideLoading();
      if (res.statusCode === 200) {
        // 请求成功
        return await this.responseHandler(res.data);
      } else {
        console.log('接口返回状态码错误', res);
        return null;
      }
    } catch (e) {
      this.hideLoading();
      console.log('接口请求失败', {
        url,
        data
      });
      return await this.errorHandler(e);
    }
  },
  async request(option) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: option.url,
        header: option.header,
        method: option.method,
        data: option.data,
        timeout: option.timeout,
        success: res => {
          resolve(res);
        },
        fail: err => {
          reject(err);
        },
      });
    });
  },

  /**
   * HTTP请求返回接口处理器
   * @param {*} response
   */
  async responseHandler(response) {
    if (response && response.code !== undefined) {
      // 规范接口返回数据，需要处理
      if (response.code === 0) {
        // 业务正确返回业务值
        return response.data;
      } else {
        // todo 错误业务处理
        return await Promise.reject(response);
      }
    }
    return response;
  },

  /**
   * HTTP错误处理器
   * @param {int} code
   * @param {Object} response
   */
  async errorHandler(e) {
    if (!e.code) {
      // 非业务错误，统一处理
      console.log('错误信息', e);
      if (e.data && e.status) {
        wx.showToast({
          icon: 'none',
          title: e.data + '[' + e.status + ']',
          duration: 3000,
        });
      } else {
        wx.showToast({
          icon: 'none',
          title: e.errorMessage + '[' + e.error + ']',
          duration: 3000,
        });
      }
    } else if (this.isOpenCodeHandler) {
      // 业务出错, 并开始code错误处理器
      await HttpErrorHandler.run(e.code, e);
    }
    return await Promise.reject(e);
  },

  /**
   * 处理path
   * 1. 没有http开头，加上接口地址
   *
   * @param {String} path
   */
  async filterPath(path) {
    if (!this.app) {
      this.app = getApp();
    }
    return path.indexOf('http') !== -1 ?
      path :
      this.app.globalData.config.API_URL + path;
  },

  /**
   * 过滤处理请求数据
   * 1. 加上token
   * 2. 除去空值
   *
   * @param {Object} data
   */
  async filterData(data) {
    data = data || {};
    // token
    data.token = User.getToken();
    // 过滤空值
    for (let key in data) {
      if (data[key] === null || data[key] === undefined) {
        delete data[key];
      }
    }
    return data;
  },

  showLoading() {
    if (this.loadingTimer) return;
    this.loadingTimer = setTimeout(_ => {
      wx.showLoading({
        title: '加载中...',
        mask: true
      });
    }, 1000);
  },

  hideLoading() {
    clearTimeout(this.loadingTimer);
    this.loadingTimer = null;
    wx.hideLoading();
  },
  //post请求
  $post(url, data = {}) {
    return Http.fetch(url, data, 'POST');
  },

  // get请求
  $get(url, data = {}) {
    return Http.fetch(url, data, 'GET');
  },
};

export default Http;