const app = getApp();
const User = app.globalData.User;
Page({
  data: {
    showPhone: false,
    code: null,
  },
  onLoad() {
    this.init();
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },
  onShow() {},
  onHide() {},
  onUnload() {},
  navigateBackOrHome() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack();
    } else {
      wx.navigateTo({
        url: `/pages/home/home`,
      });
    }
  },
  async init() {
    // this.bindGetUserInfo();
  },

  async bindGetUserInfo() {
    const checkResult = await User.wxAuthor();
    if (checkResult && checkResult.token) {
      // 已经绑定？
      await User.setToken(checkResult.token);
      this.navigateBackOrHome();
    } else if (checkResult && checkResult.code) {
      this.setData({
        showPhone: true,
        code: checkResult.code,
      });
    } else {
      this.setData({
        showPhone: false,
      });
    }
  },
  async getPhoneNumber(e) {
    if (e.detail.encryptedData) {
      const res = await User.regByWechat({
        channel: 'wechat',
        code: this.data.code,
        encryptedData: e.detail.encryptedData,
        iv: e.detail.iv,
      });
      await User.setToken(res.token);
      // 登录成功
      this.navigateBackOrHome();
    }
  },
});
