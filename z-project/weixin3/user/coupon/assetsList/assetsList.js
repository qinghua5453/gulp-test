const app = getApp();
const {
  moment
} = app.globalData.utils;
Page({
  data: {
    couponList: [],
    isNoCouponShow: false,
    allLoaded: false,
    page: 1,
    total_Page: 0,
    state: 1, //当前选中的i
    productId: 2, //优惠券
  },
  onShow() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.setData({
      couponList: [],
      page: 1,
      state: 1,
    });
    this.getCouponList();
  },

  //点击切换当前选中tab
  titlClickEvent(e) {
    let state_id = e.currentTarget.dataset.id;
    if (state_id === this.data.state) {
      return;
    }
    this.setData({
      state: state_id,
      page: 1,
      couponList: [],
    });
    this.getCouponList();
  },

  //上拉加载
  lower() {
    this.setData({
      page: this.data.page * 1 + 1,
    });
    if (this.data.page * 1 <= this.data.total_Page) {
      this.getCouponList();
    }
  },

  //获取资产列表
  async getCouponList() {
    let res = await app.$post('activation/userActivationAsset', {
      page: this.data.page,
      pageSize: 10,
      state: this.data.state,
      productId: this.data.productId,
    });
    wx.hideLoading();
    let totalPage = Math.ceil(res.total / 10);
    this.setData({
      total_Page: totalPage
    });
    //全部加载完毕显示文案提示
    if (this.data.page >= totalPage) {
      this.setData({
        allLoaded: true,
      });
    } else {
      this.setData({
        allLoaded: false,
      });
    }
    let list = res.items || [];
    list.forEach((i, v) => {
      if (i.promotion) {
        //日期转换
        i.startAt = moment(i.startAt).format('YYYY.MM.DD');
        i.endAt = moment(i.endAt).format('YYYY.MM.DD');
        i.promotion.machineParentTypeNames =
          i.promotion.machineParentTypeNames &&
          i.promotion.machineParentTypeNames.length > 0 ?
          i.promotion.machineParentTypeNames.join(',') :
          null;
        i.promotion.shopNames =
          i.promotion.shopNames && i.promotion.shopNames.length > 0 ?
          i.promotion.shopNames.join(',') :
          null;
        let {
          reduce,
          specifiedPrice,
          percentage,
          orderReachPrice,
          couponType,
          maxDiscountPrice,
          hourMinuteStartTime,
          hourMinuteEndTime,
          shopNames,
          machineParentTypeNames,
        } = i.promotion;

        Object.assgin(i, {
          reduce,
          specifiedPrice,
          percentage,
          orderReachPrice,
          couponType,
          maxDiscountPrice,
          hourMinuteStartTime,
          hourMinuteEndTime,
          shopNames,
          machineParentTypeNames,
        });
      }
    });
    this.setData({
      couponList: [...this.data.couponList, ...list],
    });
    if (this.data.couponList.length > 0) {
      this.setData({
        isNoCouponShow: false,
      });
    } else {
      this.setData({
        isNoCouponShow: true,
      });
    }
  },

  //下拉显示更多
  letShowMore(e) {
    let _index = e.currentTarget.dataset.id;
    this.data.couponList[_index].showMore = !this.data.couponList[_index]
      .showMore;
    this.setData({
      couponList: this.data.couponList,
    });
  },
});