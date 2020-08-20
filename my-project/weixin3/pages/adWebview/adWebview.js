const app = getApp();
const {
  qs
} = app.globalData.utils.queryString;
Page({
  data: {
    linkUrl: null,
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    let url = decodeURIComponent(options.linkUrl);
    this.setData({
      linkUrl: url,
    });
  },
  onShareAppMessage() {
    return {
      title: '企鹅共享',
      desc: '为用户提供多场景的共享生活服务',
      path: `/pages/adWebview/adWebview?linkUrl=${encodeURIComponent(
        this.data.linkUrl
      )}`,
    };
  },
  onmessage(e) {
    let {
      detail = {}
    } = e || {};
    let {
      type = '', data = {}
    } = detail;
    if (type === 'openMiniapp' && data.url) {
      const {
        query = {}
      } = qs.parseUrl(data.url);
      if (query.page) {
        wx.reLaunch({
          url: query.page,
        });
      }
    }
  },
});