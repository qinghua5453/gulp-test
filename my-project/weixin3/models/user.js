import http from '../utils/Http';
import log from '../utils/log';

class User {
  constructor() {
    this.privateData = {
      token: null,
      uid: null,
      // 已登录用户数据
      user: {},
      // 预注册返回数据
      preRegCode: null,
      preRegData: {},
      shopArray: null,
    };
  }

  async fetchUserData() {
    // 数据未初始化，初始化登录数据
    let token = this.getToken();
    if (!this.privateData.uid) {
      let user = await http.fetch('user/info', {
        token,
      });
      if (user) {
        this.privateData.uid = user.id;
        this.privateData.user = user;
      }
      log.setConfig({
        user: JSON.stringify({
          uid: user.id,
          phone: user.phone,
        }),
      });
    } else {
      log.setConfig({
        user: JSON.stringify({
          uid: this.privateData.uid,
          phone: this.privateData.user && this.privateData.user.phone,
        }),
      });
    }
  }

  updateUser(data) {
    this.privateData.user = data;
  }

  getUid() {
    return this.privateData.uid;
  }

  getToken() {
    return this.privateData.token;
  }

  setToken(token) {
    this.privateData.token = token;
  }

  async removeToken() {
    this.privateData.token = '';
  }

  /**
   * 尝试登录
   * 1. 未绑定，返回预注册code，和PHONE
   * 2. 已绑定, 返回token
   *
   * @param {String} authCode
   */
  async checkLogin(data) {
    let res = await http.fetch('user/checkLogin', data, 'POST');

    if (res && res.code) {
      // 情况2：未绑定，返回预注册code和数据
      this.privateData.preRegCode = res.code;
      this.privateData.preRegData = res.userInfo;
    }
    return res;
  }
  async regByWechat(data){
    let res = await http.fetch('user/regByWechatEncryptedData', data, 'POST');
    return res;
  }

  async wxlogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success(res) {
          if (res.code) {
            resolve(res);
          } else {
            reject(res.errMsg);
          }
        },
        fail(err) {
          reject(err);
        },
      });
    });
  }

  async wxGetUserInfo(options) {
    return new Promise((resolve, reject) => {
      let obj = Object.assign({}, options);
      obj.success = (res) => {
        resolve(res);
      };
      obj.fail = (err) => {
        reject(err);
      };
      wx.getUserInfo(obj);
    });
  }

  async wxAuthor() {
    const res = await this.wxlogin();
    const userInfo = await this.wxGetUserInfo({
      withCredentials: true,
    });
    this.updateUser(userInfo.userInfo);
    const checkResult = await this.checkLogin({
      channel: 'wechat',
      code: res.code,
      iv: userInfo.iv,
      encryptedData: userInfo.encryptedData,
    });
    return checkResult;
  }

  async isLogin() {
    const token = this.getToken();
    if (token) {
      return { token };
    }
    try {
      return new Promise((resolve, reject) => {
        wx.getSetting({
          success: async (res) => {
            console.log('res.authSetting is ', res.authSetting);
            if (res.authSetting['scope.userInfo']) {
              let checkResult = await this.wxAuthor();
              if (checkResult.token) {
                this.setToken(checkResult.token);
                resolve(checkResult);
                this.fetchUserData();
              } else {
                resolve(false);
              }
            } else {
              resolve(false);
            }
          },
        });
      });
    } catch (e) {
      // 授权失败
      if (e && +e.error === 11) {
        return false;
      }
      console.log(e);
    }

    return false;
  }

  /**
   * 检测是否登录，没有登录跳转登录页
   */
  async check() {
    const isLogin = await this.isLogin();
    if (isLogin) {
      return this.getToken();
    } else {
      console.log('oneLogin');
      wx.navigateTo({
        url: `/pages/oneLogin/oneLogin`,
      });
    }
    return null;
  }
  async login(token) {
    this.setToken(token);
    await this.fetchUserData();
  }
  /**
   * 退出登录（解除绑定）
   *
   * @param {boolen} hard 是否调用接口注销
   */
  async logout(hard = false) {
    if (hard) {
      // 1. 解绑
      await http.fetch(
        'user/release',
        {
          channel: 'wechat',
        },
        'POST'
      );
    }
    // 2. 清除缓存
    this.removeToken();

    // 3. 重新初始化User
    this.privateData = {
      token: '',
      uid: null,
      user: {},
      preRegCode: null,
      preRegData: {},
    };
  }
}
const currentUser = new User();
export default currentUser;
