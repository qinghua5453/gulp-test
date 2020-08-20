const app = getApp();
const moment = app.globalData.utils.moment;

Page({
  shopId: null,
  data: {
    title: null,
    newCouponStatus: null,
    actResult: null,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.shopId = options.shopId;
    let title =
      options.orderType * 1 === 1 ?
      '开通成功' :
      options.orderType * 1 === 2 ?
      '续费成功' :
      '支付成功';
    this.setData({
      title,
    });
    this.getSweepStatusCode();
  },

  getSweepStatusCode() {
    app.$post('sweepstakes/codes').then(res => {
      this.getSweepStakesStatus(res);
    });
  },

  async getSweepStakesStatus(res) {
    let userData = await app.$post('sweepstakes/status', {
      eventCodes: res.vipCreateSuccessCoupon.join(','),
      shopId: this.shopId,
    });
    this.setData({
      newCouponStatus: userData.eventStatus * 1
    });
    if (this.data.newCouponStatus === 1) {
      this.getSweepResult(userData.eventCode);
    }
  },

  getSweepResult(eventCode) {
    app
      .$post('sweepstakes/prize/result', {
        eventCode: eventCode,
        shopId: this.shopId,
      })
      .then(res => {
        this.setData({
          actResult: res,
        });
      });
  },

  goWallet() {
    wx.navigateTo({
      url: '/pages/wallet/walletList/walletList',
    });
  },

  goHome() {
    wx.reLaunch({
      url: `/pages/home/home`,
    });
  },

  goUserVip() {
    wx.navigateBack({
      delta: 1
    });
  },
});