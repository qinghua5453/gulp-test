const app = getApp();
const {
  moment
} = app.globalData.utils;

Page({
  data: {
    normal_balance: 0, // 正常余额
    restrict_balance: 0, //受限余额
    total_balance: 0, //总余额 = 正常余额 + 受限余额
    hasExpireVip: false, //vip是否过期
    isShowPop: false, //用户是否开通免密支付
    couponList: null, //可用优惠券列表
  },

  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },

  async onShow() {
    this.getUserInfo();
  },

  //用户信息
  getUserInfo() {
    app.$get('user/info', {}, true).then(e => {
      if (e.balance) {
        this.setData({
          normal_balance: parseFloat(e.balance).toFixed(2),
        });
      }
      this.showSignAlert();
      this.getVoucherUserAvailableList();
      this.getAstrictTotal();
      this.getVipList();
    });
  },

  //当前用户是否开通免密支付
  showSignAlert() {
    app.$post('alipay/isSign').then(res => {
      this.setData({
        isShowPop: res,
      });
    });
  },
  //关闭免密支付
  closePayment() {
    let that = this;
    wx.showModal({
      content: '关闭后卡包中的卡片会失效， \n确定关闭么？',
      confirmText: '取消',
      cancelText: '确定',
      success: result => {
        if (!result.confirm) {
          that.unSign();
        }
      },
    });
  },
  //解除免密支付
  unSign() {
    app.$post('alipay/unsign').then(res => {
      if (res) {
        this.setData({
          isShowPop: false,
        });
      } else {
        wx.showToast({
          icon: 'none',
          title: '操作失败',
          duration: 3000,
        });
      }
    });
  },
  //开通免密支付
  async openPayment() {
    let that = this;
    let res = await app.$post('alipay/signUrl');
    if (res) {
      let url = res.url;
      let str = encodeURIComponent(url.split('?')[1]);
      wx.paySignCenter({
        signStr: str,
        success: res => {
          if (res.resultStatus * 1 === 7000) {
            that.setData({
              isShowPop: true,
            });
          }
        },
        fail: res => {
          that.setData({
            isShowPop: false,
          });
        },
      });
    }
  },
  //判断是否有即将到期vip
  async getVipList() {
    let that = this;
    let res = await app.$post('user/vip/list', {
      isActiveVip: true
    });
    let currentTime = moment(new Date()).format('YYYY-MM-DD 00:00:00');
    let _currentTime = new Date(currentTime.replace(/\s/, 'T')).getTime();
    for (let item of res.items) {
      let cardTime = moment(item.availableTime).format('YYYY-MM-DD 24:00:00');
      let _cardTime = new Date(cardTime.replace(/\s/, 'T')).getTime();
      let _day = _cardTime - _currentTime;
      item.expireDate = Math.floor(_day / 86400000 - 1);
    }
    that.setData({
      hasExpireVip: !!res.items.find(item => item.expireDate <= 15),
    });
  },

  // 获取当前用户受限余额
  async getAstrictTotal() {
    let that = this;
    let res = await app.$post('user/astrict/list', {});
    if (res && res.length > 0) {
      let total = 0;
      res.map(item => {
        total += parseFloat(item.remainCoin);
        that.setData({
          restrict_balance: total,
        });
      });
    }
    let price =
      parseFloat(that.data.normal_balance) +
      parseFloat(that.data.restrict_balance);
    that.setData({
      total_balance: price.toFixed(2),
    });
  },
  /**
   * 可用优惠券列表
   */
  async getVoucherUserAvailableList() {
    let res = await app.$post('voucherUser/availableList');
    if (res) {
      this.setData({
        couponList: res,
      });
    }
  },
  //vip
  openVip() {
    wx.navigateTo({
      url: `/user/vip/vipList/vipList`,
    });
  },
  //优惠券
  openCoupon() {
    wx.navigateTo({
      url: `/user/coupon/couponList/couponList`,
    });
  },
  //金币
  openGold() {
    wx.navigateTo({
      url: `/user/recharge/goldList/goldList`,
    });
  },
  //总余额
  goAstrictList() {
    wx.navigateTo({
      url: `/pages/wallet/balanceDetail/balanceDetail`,
    });
  },
  //余额明细
  openBalance() {
    wx.navigateTo({
      url: `/pages/wallet/walletList/walletList`,
    });
  },
});