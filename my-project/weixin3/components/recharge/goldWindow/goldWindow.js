const app = getApp();
Component({
  data: {
    tipList: [],
  },
  properties: {
    shopId: {
      type: String,
      value: ''
    },
    shop: {
      type: String,
      value: ''
    },
    isLockResult: {
      type: Boolean,
      value: false
    },
  },
  attached() {
    this.getPromotionCenterTip();
  },

  detached() {},
  methods: {
    //获取营销tip
    async getPromotionCenterTip() {
      let res = await app.$post('promotionCenter/ownedByUser', {
        shopId: this.data.shopId,
      });
      this.setData({
        tipList: res,
      });
    },
    //点击金币
    goTokenCoin() {
      if (
        this.data.tipList &&
        this.data.tipList.length === 1 &&
        this.data.tipList[0].promotionType * 1 === 4
      ) {
        wx.navigateTo({
          url: `/user/recharge/buyGold/buyGold?shopId=${this.data.shopId}`,
          success() {
            let url = 'back';
            app.globalData.vipUrl = url;
          },
        });
      } else if (
        this.data.tipList &&
        this.data.tipList.length > 1 &&
        !this.data.isLockResult
      ) {
        wx.navigateTo({
          url: `/shop/moreEvents/moreEvents?shopId=${this.data.shopId}`,
        });
      } else if (
        this.data.tipList &&
        this.data.tipList.length > 1 &&
        this.data.isLockResult
      ) {
        wx.navigateTo({
          url: `/user/recharge/buyGold/buyGold?shopId=${this.data.shopId}`,
          success() {
            let url = 'back';
            app.globalData.vipUrl = url;
          },
        });
      }
    },

    //进入开通店铺VIP
    toCreateVip(e) {
      let that = this;
      let type = e.currentTarget.dataset.type;
      wx.navigateTo({
        url: `/pages/vip/createVip/createVip?shopId=${that.data.shopId}&type=${type}`,
        success: () => {
          let url = 'back';
          app.globalData.vipUrl = url;
        },
      });
    },
  },
});