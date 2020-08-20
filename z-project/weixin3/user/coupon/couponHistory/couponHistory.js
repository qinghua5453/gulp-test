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
    isAbate: true,
    couponList: [],
    isListNone: false,
  },
  onLoad() {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.getCouponList();
  },

  //获取过期优惠券
  async getCouponList() {
    let that = this;
    let res = await app.$post('voucherUser/notAvailableList', {});
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
    if (that.data.couponList.length === 0) {
      that.setData({
        isListNone: true,
      });
    }
    wx.hideLoading();
  },
  //下拉显示更多
  letShowMore(e) {
    let that = this;
    let _index = e.currentTarget.dataset.id;
    that.data.couponList[_index].showMore = !that.data.couponList[_index]
      .showMore;
    that.setData({
      couponList: that.data.couponList,
    });
  },
});