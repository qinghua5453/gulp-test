const app = getApp();
const {
  ShopState
} = app.globalData.utils.Mapping;
Page({
  data: {
    shopId: null,
    tipList: [],
    shop: null,
    shopState: null,
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.setData({
      shopId: options.shopId,
    });
    this.getPromotionCenterTip();
    this.getShopOutline();
  },
  //获取营销tip
  getPromotionCenterTip() {
    app
      .$post('promotionCenter/ownedByUser', {
        shopId: this.data.shopId
      })
      .then((res) => {
        this.setData({
          tipList: res,
        });
      });
  },
  // 获取店铺信息
  async getShopOutline() {
    let res = await app.$post('shop/outline', {
      shopId: this.data.shopId,
      longitude: 0,
      latitude: 0,
    });
    if (!res) {
      return;
    }
    // 距离
    if (res.distance / 1000 >= 1) {
      res.distance = Number(res.distance / 1000).toFixed(1) + 'km';
    } else {
      res.distance = res.distance + 'm';
    }
    this.setData({
      shop: res,
      shopState: ShopState[res.shopState],
    });
  },
  //进入开通店铺VIP
  toCreateVip(e) {
    let that = this;
    let type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/vip/createVip/createVip?shopId=${that.data.shop.shopId}&type=${type}`,
      success: () => {
        let url = 'back';
        app.globalData.vipUrl = url;
      },
    });
  },
  //购买金币
  goTokenCoin() {
    wx.navigateTo({
      url: `/user/recharge/buyGold/buyGold?shopId=${this.data.shop.shopId}`,
      success: () => {
        let url = 'back';
        app.globalData.vipUrl = url;
      },
    });
  },
});