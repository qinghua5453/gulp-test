const app = getApp();
Page({
  page: 1, //页码
  totalPage: 0,
  data: {
    isShowRule: false,
    isCallMerchant: false,
    list: [], //集合
    allLoaded: false,
    openIndex: null,
  },

  onShow() {
    this.page = 1;
    this.setData({
      list: [],
    });
    this.getTokenCoinList();
  },

  //获取金币列表
  getTokenCoinList() {
    app
      .$post('tokenCoin/userTokenCoins', {
        page: this.page,
        pageSize: 20,
      })
      .then(res => {
        // 分页
        let _totalPage = Math.ceil(res.total / 20);
        this.totalPage = _totalPage;
        if (this.page >= _totalPage && _totalPage > 0) {
          this.setData({
            allLoaded: true,
          });
        } else {
          this.setData({
            allLoaded: false,
          });
        }
        let arr = res.items || [];
        let goldList = this.data.list;
        goldList = [...goldList, ...arr];
        this.setData({
          list: goldList,
        });
      });
  },
  //上拉加载
  lower() {
    this.page = this.page + 1;
    if (this.page * 1 <= this.totalPage) {
      this.getTokenCoinList();
    }
  },
  //规则
  openRule() {
    this.setData({
      isShowRule: true
    });
  },
  //关闭规则
  closeRule() {
    this.setData({
      isShowRule: false
    });
  },
});