const app = getApp();
let _page;

Page({
  data: {
    walletList: [], //余额列表
    normal_balance: 0, // 正常余额
    allLoaded: false, //没有更多了
    listNoneShow: false,
    couponList: [],
    restrict_balance: 0, //受限余额
    total_balance: 0, //总余额 = 正常余额 + 受限余额
    currentTab: 0, //头部索引
  },
  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    let that = this;
    _page = 0;
    if (that.data.currentTab === 0) {
      that.getWalletList();
    } else {
      that.getRestrictBalanceList();
    }
    that.getCouponList();
    //获取用户正常余额
    app.$get('user/info', {}).then(e => {
      that.setData({
        normal_balance: e.balance,
      });
      that.getAstrictTotal();
    });
  },

  // 获取当前用户受限余额
  getAstrictTotal() {
    let that = this;
    app.$post('user/astrict/list', {}).then(e => {
      if (e && e.length > 0) {
        let total = 0;
        e.map(item => {
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
    });
  },
  // 选择正常余额或者受限余额
  chooseBalanceType(e) {
    let index = e.currentTarget.dataset.index;
    if (this.data.currentTab == index) {
      return;
    }
    this.setData({
      currentTab: index,
      allLoaded: false,
      walletList: [],
      listNoneShow: false,
    });
    _page = 0;
    if (index == 0) {
      this.getWalletList();
    } else {
      this.getRestrictBalanceList();
    }
  },
  //获取正常余额消费流水
  getWalletList() {
    _page++;
    let that = this;
    let _walletList = that.data.walletList;
    app.$post('user/wallet/list', {
      page: _page,
      pageSize: 10
    }).then(res => {
      let totalPage = Math.ceil(res.total / 10);
      if (_page >= totalPage) {
        that.setData({
          allLoaded: true,
        });
      } else {
        that.setData({
          allLoaded: false,
        });
      }
      if (res.items && res.items.length > 0) {
        _walletList = [..._walletList, ...res.items];
        this.setData({
          walletList: _walletList,
        });
      }
      if (_walletList.length > 0) {
        that.setData({
          listNoneShow: false,
        });
      } else {
        that.setData({
          listNoneShow: true,
        });
      }
    });
  },
  //获取受限余额消费流水
  getRestrictBalanceList() {
    _page++;
    let that = this;
    let _walletList = that.data.walletList;
    app
      .$post('user/astrict/serial', {
        page: _page,
        pageSize: 10
      })
      .then(res => {
        let totalPage = Math.ceil(res.total / 10);
        if (_page >= totalPage) {
          that.setData({
            allLoaded: true,
          });
        } else {
          that.setData({
            allLoaded: false,
          });
        }
        if (res.items && res.items.length > 0) {
          _walletList = [..._walletList, ...res.items];
          this.setData({
            walletList: _walletList,
          });
        }
        if (_walletList.length > 0) {
          that.setData({
            listNoneShow: false,
          });
        } else {
          that.setData({
            listNoneShow: true,
          });
        }
      });
  },
  //获取可用优惠券
  getCouponList() {
    app.$post('voucherUser/availableList', {}, true).then(res => {
      this.setData({
        couponList: res.items || null,
      });
    });
  },
});