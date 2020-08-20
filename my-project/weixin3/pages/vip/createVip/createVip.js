const app = getApp();
const {
  User
} = app.globalData;
Page({
  isDisable: false,
  data: {
    vipAddType: null, // 2为开通vip，1为续费vip
    shopVipDetail: [], //店铺VIP卡信息
    saleDescVOList: [], //vip类型列表
    isMoreShopShow: false, //适用店铺太多的时候显示
    shopNameList: [], //适用店铺
    chooseIndex: 0, //选中类型
    timeInterval: null, //选中的时长
    price: null, // 选中的价格
    shopId: null, //店铺id
    shopVipId: null,
    payList: [], // 可支付方式列表
    isActivityShop: 0, //是否是活动店铺vip
    type: 1, //支付类型：1为微信，2为余额
    balanceTotal: null, //余额
    orderDetail: [], //创建的订单详情
    balanceItem: true, //判断余额是否足够
    isShowFixed: false,
    shopDiscount: null,
  },
  onLoad(res) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#FFD26B'
    });
    this.isDisable = false;
    this.setData({
      shopId: res.shopId,
      shopVipId: res.shopVipId,
      vipAddType: res.type,
      isActivityShop: res.activity,
    });
  },
  onShow() {
    if (app.globalData.qrCode) {
      let data = app.globalData.utils.queryString.parseUrl(
        app.globalData.qrCode
      );
      if (data && data.url) {
        let array = data.url.split('https://h5.qiekj.com/createVip/');
        if (array && array.length > 1) {
          let id = array[1];
          app.globalData.vipUrl = '/pages/home/home';
          this.setData({
            shopId: id,
          });
        }
      }
    }
    User.check().then(() => {
      this.getShopVipList();
      this.getUservipInfo();
    });
  },

  getUservipInfo() {
    app.$post('user/vip/info', {
      shopId: this.data.shopId
    }).then(res => {
      let type = null;
      if (res) {
        type = 1;
      } else {
        type = 2;
      }
      this.setData({
        vipAddType: type,
      });
    });
  },
  //获取店铺VIP
  async getShopVipList() {
    let that = this;
    let res = await app.$post('shop/vip/list', {
      shopId: that.data.shopId,
      shopVipId: that.data.shopVipId,
    });
    let _allowPayType = res.allowPayType.split(',');
    that.setData({
      shopVipDetail: res,
      saleDescVOList: res.saleDescVOList,
      payList: _allowPayType,
    });
    that.setData({
      shopDiscount: parseFloat(res.cardDiscount * 10).toFixed(1),
    });
    //适用店铺列表
    let _shopNameList = [];
    for (let item of that.data.shopVipDetail.shopTipVOS) {
      _shopNameList.push(item.shopName);
    }
    that.setData({
      shopNameList: _shopNameList.join(','),
    });
    if (that.data.shopNameList.length > 21) {
      that.setData({
        isMoreShopShow: true,
      });
    }
    //显示默认推荐
    for (let item of that.data.saleDescVOList) {
      item.isRecommend = false;
    }
    let recommendIndex =
      res.saleDescVOList && res.saleDescVOList.length > 2 ? 1 : 0;
    that.setData({
      chooseIndex: recommendIndex,
      ['saleDescVOList[' + recommendIndex + '].isRecommend']: true,
      price: that.data.saleDescVOList[recommendIndex].price,
      timeInterval: that.data.saleDescVOList[recommendIndex].timeInterval,
    });
  },

  //显示更多适用店铺
  letMoreShopShow() {
    this.setData({
      isMoreShopShow: !this.data.isMoreShopShow,
      isShowFixed: !this.data.isShowFixed,
    });
  },

  //选择购买vip类型
  chooseVipType(e) {
    let that = this;
    let _chooseIndex = e.currentTarget.dataset.type;
    that.setData({
      chooseIndex: _chooseIndex,
      price: that.data.saleDescVOList[_chooseIndex].price,
      timeInterval: that.data.saleDescVOList[_chooseIndex].timeInterval,
    });
  },
  //立即开通
  createVip() {
    let that = this;
    if (that.isDisable) {
      return;
    }
    that.isDisable = true;
    let url = that.data.vipAddType == 1 ? 'user/vip/renew' : 'user/vip/create';
    app
      .$post(
        url, {
          shopId: that.data.shopVipDetail.shopIds,
          shopVipId: that.data.shopVipDetail.cardId,
          timeInterval: that.data.timeInterval,
          vipCardType: that.data.shopVipDetail.cardType,
        },
        true
      )
      .then(res => {
        that.isDisable = false;
        that.setData({
          orderDetail: res,
        });
        that.goVipDetail();
      });
  },

  // 进入vip详情
  goVipDetail() {
    wx.redirectTo({
      url: `/user/vip/vipResult/vipResult?orderId=${this.data.orderDetail.orderId}`,
    });
  },
});