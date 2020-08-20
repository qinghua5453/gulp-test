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
    couponId: null, //当前选中的id
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    if (options.couponList) {
      let list = JSON.parse(options.couponList);
      this.getCouponList(list);
    }
    this.setData({
      couponId: options.couponId,
    });
  },
  getCouponList(_couponList) {
    _couponList = _couponList.map(item => {
      item.startDate = moment(item.startDate).format('YYYY.MM.DD');
      item.endDate = moment(item.endDate).format('YYYY.MM.DD');
      //分别拆分面值整数已经小数
      if (item.type === 3) {
        item.faceValue = (Number(item.faceValue) * 10).toFixed(1);
      }
      const temp = item.faceValue.split('.');
      item['priceInteger'] = temp[0];
      item['priceDecimal'] = temp[1];
      //转换适用类型
      const usePositionList = item.usePositionList.split(',');
      const usePositionListNames = usePositionList.map(k => {
        return CouponType[k];
      });
      item.usePositionList = usePositionListNames.join(',');
      return item;
    });
    this.setData({
      couponList: _couponList,
    });
  },

  changeCouponId(e) {
    this.setData({
      couponId: e.detail.couponId,
    });
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    prevPage.setData({
      couponId: e.detail.couponId,
      isPreview: false,
    });
    wx.navigateBack();
    // this.triggerEvent('selectcoupon',{ couponId: e.detail.couponId });
  },

  closeCoupon() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    prevPage.setData({
      isPreview: false,
      couponId: '0',
    });
    wx.navigateBack();
    // this.triggerEvent('selectcoupon',{ couponId: '0' });
  },
});