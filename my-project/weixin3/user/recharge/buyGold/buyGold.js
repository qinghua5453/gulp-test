const app = getApp();
const {
  User
} = app.globalData;
Page({
  shopId: null,
  goodsId: null, //商品id
  goodsType: null, //商品类型
  data: {
    isDisable: false,
    chooseIndex: null,
    isCanUse: false,
    shopTokenCoinRewards: null, //金币奖励列表
    tokenCoinRewardId: [], //金币买赠营销id
    Num: null, //购买商品数量
    chooseItem: null,
    errorText: null,
    isShowError: false,
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    this.shopId = options.shopId;
  },
  onShow() {
    this.setData({
      isDisable: false
    });
    User.check().then(() => {
      this.getShopDetail();
    });
  },

  //金币商品详情
  async getTokenCoinGoods() {
    let res = await app.$post('tokenCoin/goods', {
      shopId: this.shopId
    });
    if (!res) {
      return;
    }
    if (res.shopTokenCoinRewards && res.shopTokenCoinRewards.length > 0) {
      for (let item of res.shopTokenCoinRewards) {
        item.totalCoin = Number(item.reach) + Number(item.reward);
        item.rewardCoin = Number(item.reward) / 100;
      }
    }
    this.shopId = res.shopId;
    this.goodsId = res.goodsId;
    this.goodsType = res.goodsType;
    this.setData({
      shopTokenCoinRewards: res.shopTokenCoinRewards,
    });
    if (res.shopTokenCoinRewards && res.shopTokenCoinRewards.length <= 0) {
      this.setData({
        errorText: '该店铺通用小票活动已结束',
        isShowError: true,
      });
    } else {
      this.setData({
        isShowError: false,
      });
    }
  },

  //获取店铺详情
  async getShopDetail() {
    let res = await app.$post('shop/detail', {
      shopId: this.shopId
    });
    if (!res) {
      return;
    }
    if (res.shopState == 1 || res.shopState == 3 || res.shopState == 4) {
      let desc =
        res.shopState == 1 || res.shopState == 3 ?
        '店铺已暂停营业' :
        '店铺不存在';
      this.setData({
        errorText: desc,
        isShowError: true,
        shopTokenCoinRewards: [],
      });
      return;
    }
    if (res.shopState == 2 || res.shopState == 5) {
      await this.getTokenCoinGoods();
    }
  },

  //选择购买金币
  ckGoidItem(e) {
    let index = e.currentTarget.dataset.index;
    let item = this.data.shopTokenCoinRewards[index];
    this.setData({
      chooseIndex: index * 1,
      isCanUse: true,
      chooseItem: item,
    });
  },
  //打开金币协议
  openAgreement() {
    wx.navigateTo({
      url: `/user/recharge/goldAgreement/goldAgreement`,
    });
  },
  //立即购买
  async buyCoin() {
    let that = this;
    await that.getShopDetail();
    if (!that.data.isShowError && that.data.isCanUse) {
      let id = that.data.shopTokenCoinRewards.findIndex(
        (item) => item.id === that.data.chooseItem.id
      );
      let reward = that.data.shopTokenCoinRewards.findIndex(
        (item) => item.reward === that.data.chooseItem.reward
      );
      let reach = that.data.shopTokenCoinRewards.findIndex(
        (item) => item.reach === that.data.chooseItem.reach
      );
      if (id === -1 || reach === -1 || reward === -1) {
        wx.showModal({
          showCancel: false,
          title: '提示',
          content: '信息已更新，请重新购买',
        });
        that.setData({
          chooseIndex: null,
          isCanUse: false,
          chooseItem: null,
        });
        return;
      }
      app
        .$post('order/createVirtualOrder', {
          shopId: that.shopId,
          goodsId: that.goodsId,
          goodsType: that.goodsType,
          Num: that.data.chooseItem.reach,
          tokenCoinRewardId: that.data.chooseItem.id,
        })
        .then((res) => {
          wx.redirectTo({
            url: `/user/vip/vipResult/vipResult?orderId=${res.orderId}&isTokenCoin=1`,
          });
        });
    }
  },
});