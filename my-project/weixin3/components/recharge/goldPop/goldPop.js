const app = getApp();

Component({
  data: {
    isShowPop: false,
    isCallMerchant: false,
    cacheArray: null, //缓存的店铺id
    incloudIndex: null,
    isForceUse: 0, //是否强制
  },
  properties: {
    shopId: {
      type: String,
      value: ''
    },
    shopName: {
      type: String,
      value: ''
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
      if (res && res.length > 0) {
        let goldItem = res.find(item => item.promotionType === 4);
        if (goldItem && goldItem.promotionInfoOfShop.isForceUse * 1 === 1) {
          this.setData({
            isShowPop: true,
          });
        } else {
          this.setData({
            isShowPop: false,
          });
        }
      }
    },
    //关闭金币
    closePop() {
      this.setData({
        isShowPop: false
      });
    },
    //买金币
    buyGold() {
      wx.navigateTo({
        url: `/user/recharge/buyGold/buyGold?shopId=${this.data.shopId}`,
        success() {
          let url = 'back';
          app.globalData.vipUrl = url;
        },
      });
    },
  },
});