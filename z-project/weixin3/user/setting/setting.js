const SHOP_SAAS = 'shopSaas';
const app = getApp();
const User = app.globalData.User;
const Cache = app.globalData.Cache;

Page({
  data: {
    menulist: [

      {
        iconUrl: '',
        name: '个人信息',
        type: 1,
        appId: '',
        linkUrl: '/user/userInfo/userInfo',
      },
      {
        iconUrl: '',
        name: '关于我们',
        type: 1,
        appId: '',
        linkUrl: '/user/about/about',
      },
    ],
  },
  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },
  loginOut() {
    wx.showModal({
      title: '提示',
      content: '您确定要解除绑定?',
      confirmText: '确定',
      cancelText: '取消',
      success: result => {
        if (result.confirm) {
          // 调用注销接口退出
          User.logout(true).then(_ => {
            wx.navigateBack({
              detal: 1
            });
            Cache.remove('CACHE_ACTIVITY');
            Cache.remove(SHOP_SAAS);
            Cache.remove('CACHE_INDEXPOP');
          });
        }
      },
    });
  },
});