const app = getApp();

Page({
  data: {
    orderList: [], //余额列表
    allLoaded: false, //没有更多了
    listNoneShow: false,
    page: 1,
    total_Page: 0,
    isLoading: false,
  },

  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },

  onShow() {
    let that = this;
    that.setData({
      orderList: [],
      page: 1,
      isLoading: true,
    });
    that.getOrderList();
  },

  onReachBottom() {
    this.setData({
      page: this.data.page * 1 + 1,
    });
    if (this.data.page * 1 <= this.data.total_Page) {
      this.getOrderList();
    }
  },

  //获取订单列表
  async getOrderList() {
    let that = this;
    let _orderList = this.data.orderList;
    let res = await app.$get(
      'order/list', {
        page: that.data.page,
        pageSize: 10
      },
      true
    );
    let totalPage = Math.ceil(res.total / 10);
    that.setData({
      total_Page: totalPage,
      isLoading: false
    });
    //全部加载完毕显示文案提示
    if (that.data.page >= totalPage && totalPage > 0) {
      that.setData({
        allLoaded: true,
      });
    } else {
      that.setData({
        allLoaded: false,
      });
    }
    //转换订单状态
    let arr = res.items || [];
    arr.forEach(function(v, k) {
      let reg = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/g;
      let time =
        v.orderNo && v.orderNo.length === 22 ?
        v.orderNo.substring(2, 16) :
        null;
      v.unlockTime = time ? time.replace(reg, '$1-$2-$3 $4:$5:$6') : null;
    });

    _orderList = [..._orderList, ...arr];
    that.setData({
      orderList: _orderList,
    });
    if (_orderList.length > 0) {
      that.setData({
        listNoneShow: false,
      });
    } else {
      that.setData({
        listNoneShow: true,
      });
    }
  },
});