const app = getApp();
Component({
  data: {
    visible: false,
    cashValue: 0,
    presentAmount: 0,
  },
  properties: {
    list: {
      type: Array,
      value: []
    },
  },
  attached() {},

  detached() {},
  methods: {
    //获取店铺详情
    async getShopDetail(shopId) {
      let res = await app.$post('shop/detail', {
        shopId: shopId
      });
      if (!res) {
        return;
      }
      if (res.shopState !== 2 && res.shopState != 5) {
        wx.showModal({
          showCancel: false,
          title: '提示',
          content: '适用店铺有变化，暂不支持购买',
        });
      } else {
        wx.navigateTo({
          url: `/user/recharge/buyGold/buyGold?shopId=${shopId}`,
          success() {
            let url = 'back';
            app.globalData.vipUrl = url;
          },
        });
      }
    },
    //金币明细
    openGoldDetail(e) {
      let shopId = e.currentTarget.dataset.id;
      wx.navigateTo({
        url: `/user/recharge/goldDetail/goldDetail?shopId=${shopId}`,
      });
    },
    //购买金币
    openBuyGold(e) {
      let shopId = e.currentTarget.dataset.id;
      this.getShopDetail(shopId);
    },
  },
});