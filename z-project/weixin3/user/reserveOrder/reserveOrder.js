const app = getApp();

Page({
  page: 1,
  totalPage: 0,

  data: {
    orderList: [],
    allLoaded: false,
    listNoneShow: false,
  },

  onLoad() {
    wx.setNavigationBarColor({
      frontColor: '#000000',
      backgroundColor: '#ffffff'
    });
  },

  onShow() {
    this.page = 1;
    this.setData({
      orderList: [],
    });
    this.getOrderList();
  },

  onReachBottom() {
    this.page = this.page + 1;
    if (this.page * 1 <= this.totalPage) {
      this.getOrderList();
    }
  },

  async getOrderList() {
    let res = await app.$post('shower/appoint/list', {
      page: this.page,
      pageSize: 10,
    });
    let _totalPage = Math.ceil(res.total / 10);
    this.totalPage = _totalPage;
    //全部加载完毕显示文案提示
    if (this.page >= _totalPage && _totalPage > 0) {
      this.setData({
        allLoaded: true,
      });
    } else {
      this.setData({
        allLoaded: false,
      });
    }
    let list = res.items || [];
    this.setData({
      orderList: [...this.data.orderList, ...list],
    });
    if (this.data.orderList.length > 0) {
      this.setData({
        listNoneShow: false,
      });
    } else {
      this.setData({
        listNoneShow: true,
      });
    }
  },
});