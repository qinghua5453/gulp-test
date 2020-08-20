const app = getApp();
const {
  moment,
  Mapping
} = app.globalData.utils;
const {
  CouponType
} = Mapping;

Page({
  data: {
    couponList: [],
    isNoCouponShow: false,
  },
  onShow() {
    this.getCouponList();
  },
  //获取可用优惠券
  async getCouponList() {
    let that = this;
    let res = await app.$post('voucherUser/availableList', {}, true);
    if (res.items.length <= 0) {
      that.setData({
        isNoCouponShow: true,
      });
    } else {
      that.setData({
        isNoCouponShow: false,
      });
    }
    //给数据格式化
    for (let item of res.items) {
      //转换适用类型
      item.usePositionList = item.usePositionList.split(',');
      let arr = item.usePositionList.map(e => {
        e = CouponType[e];
        return e;
      });
      item.usePositionList = arr.join(',');
      //日期转换
      item.startDate = moment(item.startDate).format('YYYY.MM.DD');
      item.endDate = moment(item.endDate).format('YYYY.MM.DD');
      //分别拆分面值整数已经小数
      if (item.type === 3) {
        item.faceValue = (item.faceValue * 10).toFixed(1);
      }
      let faceValues = item.faceValue.split('.');
      item.priceInteger = faceValues[0];
      item.priceDecimal = faceValues[1];
    }
    that.setData({
      couponList: res.items,
    });
  },

  letShowMore(e) {
    let that = this;
    let _index = e.currentTarget.dataset.id;
    that.data.couponList[_index].showMore = !that.data.couponList[_index]
      .showMore;
    that.setData({
      couponList: that.data.couponList,
    });
  },

  //进入余额
  toWallets() {
    wx.redirectTo({
      url: '/pages/wallet/walletList/walletList',
    });
  },
  //进入历史过期优惠券
  toCouponHistory() {
    wx.navigateTo({
      url: '/user/coupon/couponHistory/couponHistory',
    });
  },
});