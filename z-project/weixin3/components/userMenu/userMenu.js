const app = getApp();
Component({
  data: {},
  properties: {
    menuitem: {
      type: Object,
      value: {}
    },
  },
  attached() {},

  detached() {},
  methods: {
    //获取token
    getToken(URL) {
      let token = app.globalData.User.getToken();
      wx.navigateTo({
        url: token ? URL : `/pages/oneLogin/oneLogin?chooseType=1`,
      });
    },
    // 点击跳转
    tolink(e) {
      let data = e.currentTarget.dataset.item;
      var that = this;
      console.log(this);
      if (data.type == 1) {
        let _URL = data.linkUrl;
        that.getToken(_URL);
      } else if (data.type == 2) {
        wx.navigateToMiniProgram({
          appId: data.appId,
        });
      }
    },
  },
});