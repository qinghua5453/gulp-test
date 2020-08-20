const app = getApp();
const {
  moment
} = app.globalData.utils;

Page({
  data: {
    couponList: [],
    couponId: '',
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
      couponId: options.couponActivationAssetId,
    });
  },

  getCouponList(_couponList) {
    _couponList = _couponList.map(item => {
      item.machineParentTypeNames =
        item.machineParentTypeNames && item.machineParentTypeNames.length > 0 ?
        item.machineParentTypeNames.join(',') :
        '';
      item.shopNames =
        item.shopNames && item.shopNames.length > 0 ?
        item.shopNames.join(',') :
        '';
      item.startAt = moment(item.startAt).format('YYYY.MM.DD');
      item.endAt = moment(item.endAt).format('YYYY.MM.DD');
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
      couponActivationAssetId: e.detail.couponId,
      isPreview: false,
    });
    wx.navigateBack();
  },

  closeCoupon() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    prevPage.setData({
      couponActivationAssetId: '0',
      isPreview: false,
    });
    wx.navigateBack();
  },
});