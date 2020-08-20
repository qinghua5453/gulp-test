const app = getApp();
const {
  User
} = app.globalData;
Page({
  data: {
    userInfo: null,
    headImageId: app.globalData.imgUrl + 'h5/miniApp/user/head_img.png',
    phone: null,
    hasVip: false,
    menus: [{
        iconUrl: 'https://static.qiekj.com/h5/alipay/user/icon-reserve.png',
        name: '我的预约',
        linkUrl: '/user/reserveOrder/reserveOrder',
      },
      {
        iconUrl: 'https://static.qiekj.com/h5/alipay/user/icon-order.png',
        name: '我的订单',
        linkUrl: '/pages/order/orderList/orderList',
      },
    ],
    billlist: [


      {
        iconUrl: 'icon-icon-huanyingtucao',
        name: '欢迎吐槽',
        type: 1,
        appId: '',
        linkUrl: '/user/feedback/feedback',
      },
      {
        iconUrl: 'icon-icon-shezhi',
        name: '设置',
        type: 1,
        appId: '',
        linkUrl: '/user/setting/setting',
      },
    ],
    isReloadAd: false,
  },

  async onShow() {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1176FF'
    });
    this.loginUser();
  },

  onPullDownRefresh() {
    wx.stopPullDownRefresh();
    this.setData({
      isReloadAd: true,
    });
    setTimeout(() => {
      this.setData({
        isReloadAd: false,
      });
    }, 0);
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1176FF'
    });
    this.loginUser();
  },

  //获取token
  async getToken(URL) {
    let token = await User.check();
    wx.navigateTo({
      url: token ? URL : `/pages/oneLogin/oneLogin?chooseType=1`,
    });
  },

  //获取个人信息
  loginUser() {
    let that = this;
    app.$post('user/info').then(res => {
      let user = res;
      let reg = /^(\d{3})\d{4}(\d+)/;
      that.setData({
        userInfo: user,
        phone: user.phone ? user.phone.replace(reg, '$1****$2') : '',
        headImageId: user.headImageId ?
          user.headImageId :
          app.globalData.imgUrl + 'h5/miniApp/user/head_img.png',
        hasVip: user.hasVip,
      });
    });
  },
  async toLogin() {
    let token = await User.check();
    wx.navigateTo({
      url: token ?
        `/user/userInfo/userInfo` :
        `/pages/oneLogin/oneLogin?chooseType=1`,
    });
  },
  //菜单跳转
  toMenuPage(e) {
    var that = this;
    let data = e.currentTarget.dataset;
    let _URL = data.item.linkUrl;
    that.getToken(_URL);
  },
});