const app = getApp();
Component({
  data: {
    isShowPopup: false,
    userProperty: null, //用户属性: 0--都不是, 1--新用户, 2--老用户
    type: null, //弹框类型:0--未定义的弹框, 1--19.9弹框, 2--9.9弹框, 3--夏季清凉福利
  },
  properties: {
    shopId: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    if (this.data.shopId) {
      this.showEventStatus();
    }
  },

  detached() {},
  methods: {
    // 获取活动状态
    showEventStatus() {
      let that = this;
      if (that.data.shopId) {
        app
          .$post('sweepstakes/vip/popup', {
            shopId: that.data.shopId
          })
          .then(e => {
            if (e.code != 0 && e.userProperty != 0 && e.type != 0) {
              wx.uma.trackEvent('user_vip_count', {
                type: 'exposure'
              });
            }
            that.setData({
              isShowPopup: e.code != 0 && e.userProperty != 0 && e.type != 0 ?
                true :
                false,
              userProperty: e.userProperty,
              type: e.type,
            });
          });
      }
    },
    goVip(e) {
      wx.uma.trackEvent('user_vip_count', {
        type: 'click'
      });
      let that = this;
      let type = e.currentTarget.dataset.type;
      if (that.data.shopId) {
        wx.navigateTo({
          url: `/pages/vip/createVip/createVip?shopId=${that.data.shopId}&activity=1&type=${type}`,
          success() {
            let url = 'back';
            app.globalData.vipUrl = url;
          },
        });
      }
    },
    closeVip() {
      this.setData({
        isShowPopup: false,
      });
      this.triggerEvent('finish', this.data.isShowPopup);
    },
  },
});