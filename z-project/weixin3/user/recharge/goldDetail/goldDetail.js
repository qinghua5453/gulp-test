const app = getApp();
Page({
  data: {
    shopId: null,
    page: 0, //页码
    pageSize: 20,
    list: [], //集合
    allLoaded: false,
    listNoneShow: false,
  },

  onShow() {
    this.setData({
      list: [],
      page: 0,
      allLoaded: false,
      listNoneShow: false,
    });
    this.getTokenCoinLogs();
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.setData({
      shopId: options.shopId,
    });
  },

  //金币流水明细
  getTokenCoinLogs() {
    this.data.page++;
    let _walletList = this.data.list;
    app
      .$post('tokenCoin/userTokenCoinLogs', {
        shopId: this.data.shopId,
        page: this.data.page,
        pageSize: this.data.pageSize,
      })
      .then(res => {
        let totalPage = Math.ceil(res.total / 20);
        if (this.data.page >= totalPage) {
          this.setData({
            allLoaded: true,
          });
        } else {
          this.setData({
            allLoaded: false,
          });
        }
        if (res.items && res.items.length > 0) {
          _walletList = [..._walletList, ...res.items];
          this.setData({
            list: _walletList,
          });
        }
        if (_walletList && _walletList.length > 0) {
          this.setData({
            listNoneShow: false,
          });
        } else {
          this.setData({
            listNoneShow: true,
          });
        }
      });
  },
});