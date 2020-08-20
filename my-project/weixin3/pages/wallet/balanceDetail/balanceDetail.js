const app = getApp();
Page({
  data: {
    normal_balance: 0, // 正常余额
    restrict_balance: 0, //受限余额
    total_balance: 0, //总余额 = 正常余额 + 受限余额
    list: [], //受限余额
  },
  onLoad() {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    let that = this;
    //获取用户正常余额
    app.$get('user/info', {}, true).then(e => {
      if (e.balance) {
        that.setData({
          normal_balance: parseFloat(e.balance).toFixed(2),
        });
      }
      that.getAstrictTotal();
    });
  },
  // 获取当前用户受限余额
  async getAstrictTotal() {
    let that = this;
    let res = await app.$post('user/astrict/list', {});
    that.setData({
      list: res,
    });
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
});