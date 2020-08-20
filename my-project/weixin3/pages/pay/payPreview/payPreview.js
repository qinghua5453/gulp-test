const app = getApp();
const {
  MachinePrePay,
  User
} = app.globalData;
const {
  log
} = app.globalData.utils;
Page({
  machineFunctionId: null, //设备功能id
  memberVipCardId: null, //会员卡id
  timeMarketId: null, //限时特惠id
  useTime: null, //充电桩时间
  skuIds: null, //洗衣液投放器
  useSkuIds: null,
  useTokenCoin: null,
  appointOrderId: null,
  userBalance: 0,
  userAstrictBalance: 0,

  data: {
    machine: null, //机器信息
    couponId: null, //默认选中的优惠券id
    couponActivationAssetId: null, //新优惠券id
    payType: 3, //支付方式 1 微信 2 余额
    skus: [],
    isCharge: true,
    isShowChargPower: false, //充电时间说明
    quantity: null, //充电功率信息
    isSkuId: false,
    resultPage: null,
    isPreview: true,
    appointOrderId: null,
    useTime: null, //充电桩时间
    skuIds: null, //洗衣液投放器
    paymentData: {
      appointOrderId: null,
      skuIds: null,
      useTime: null,
      resultPage: null,
      totalBalance: 0,
    },
    balanceData: null,
  },

  async onLoad(res) {
    if (!res.machineFunctionId) {
      wx.redirectTo({
        url: '/pages/home/home',
      });
      return;
    }
    this.appointOrderId = res.appointOrderId || null;
    this.machineFunctionId = res.machineFunctionId || null;
    this.useTime = res.num || this.useTime;
    this.skuIds = res.skuIds || null;
    this.useSkuIds = res.skuIds || null;
    this.setData({
      quantity: MachinePrePay.privateData.params,
      'paymentData.resultPage': res.resultPage || null,
      'paymentData.appointOrderId': res.appointOrderId || null,
      'paymentData.useTime': res.num || this.useTime,
      'paymentData.skuIds': res.skuIds || null,
    });
  },

  async onShow() {
    const token = await User.check();
    if (token) {
      this.init();
    }
  },

  init() {
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    this.updateOrderPreview();
  },

  async updateOrderPreview() {
    const res = await app.$post('order/preview', {
      machineFunctionId: this.machineFunctionId,
      isPreview: this.data.isPreview ? 1 : 0,
      memberVipCardId: this.memberVipCardId,
      appointOrderId: this.appointOrderId,
      timeMarketId: this.timeMarketId,
      voucherUserId: this.data.couponId,
      useTokenCoin: this.useTokenCoin,
      couponActivationAssetId: this.data.couponActivationAssetId,
      skuIds: this.skuIds,
      optSkuIds: this.useSkuIds,
      useTime: this.useTime,
    });
    if (!res) {
      return;
    }
    if (res.isSATACharge * 1 === 1) {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#1677FF'
      });
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#ffffff'
      });
    }
    const that = this;
    wx.hideLoading();
    //充电桩
    if (this.useTime > 0) {
      switch (res.markUnit) {
        case 'h':
          res.markMinutes = this.useTime / 3600;
          break;
        case 'm':
          res.markMinutes = this.useTime / 60;
          break;
        default:
          res.markMinutes = this.useTime;
      }
    }
    this.setData({
      machine: res,
    });
    log
      .push({
        vipCard: JSON.stringify(res.vipCardPromotionDiscount),
      })
      .done();
    if (res && res.skus) {
      let skus = res.skus;
      let newArr = [];
      skus.forEach((sku) => {
        if (sku.brandTypes === '1') {
          sku.washLiquidIcon = 'washLiquid';
        } else if (sku.brandTypes === '2') {
          sku.washLiquidIcon = 'cleargerm';
        } else if (sku.brandTypes.indexOf(',') !== -1) {
          sku.washLiquidIcon = 'mergeIcon';
        }
        newArr.push(sku);
      });
      skus = newArr;
      this.setData({
        skus: skus,
      });
    } else {
      this.setData({
        skus: null,
      });
    }
    this.setDefaultValue(res); //设置默认值
    this.getUserBalance(res.machineId);
  },

  /**用户正常余额 */
  async getUserBalance(machineId) {
    let res = await app.$post('user/info');
    this.userBalance = Number(res.balance);
    await this.getUserAstrictBalance(machineId);
  },
  /**用户受限余额 */
  async getUserAstrictBalance(machineId) {
    let res = await app.$post('user/astrict/residue', {
      machineId: machineId,
    });
    if (res && res.remainCoin) {
      this.userAstrictBalance = Number(res.remainCoin);
    }
    //余额支付按钮是否展示
    let _totalBalance =
      Number(this.userBalance) + Number(this.userAstrictBalance);
    this.setData({
      'paymentData.totalBalance': _totalBalance.toFixed(2),
      'balanceData.userBalance': this.userBalance,
      'balanceData.userAstrictBalance': this.userAstrictBalance,
    });
  },

  /**选择洗衣液 */
  selectDetergent(e) {
    let index = e.currentTarget.dataset.index;
    let _skuId = this.data.skus[index].skuId;
    this.setData({
      isSkuId: !this.data.isSkuId,
    });
    if (this.data.isSkuId) {
      this.skuIds = _skuId;
    } else {
      this.skuIds = null;
    }
    this.setData({
      isPreview: false,
      'paymentData.skuIds': this.skuIds,
    });
    this.updateOrderPreview();
  },

  /**选择支付方式 */
  selectPayType(e) {
    this.setData({
      payType: e.detail.type
    });
  },

  //默认选中vip或者限时特惠
  setDefaultValue(res) {
    let timeMarket = res.timeMarketPromotionDiscount;
    let vipCard = res.vipCardPromotionDiscount;
    let skus = res.skus;

    if (timeMarket && timeMarket.isUsed) {
      this.timeMarketId = timeMarket.promotionId;
      this.memberVipCardId = null;
    } else if (vipCard && vipCard.isUsed) {
      this.memberVipCardId = vipCard.promotionId;
      this.timeMarketId = null;
    }
    if (skus && skus.length > 0) {
      let use = skus[0].use;
      if (use) {
        this.setData({
          isSkuId: true,
        });
      } else {
        this.setData({
          isSkuId: false,
        });
      }
    }
  },

  async updatePayPreview(e) {
    this.memberVipCardId = e.detail.memberVipCardId || null;
    this.timeMarketId = e.detail.timeMarketId || null;
    let isCoin = e.detail.isCoin;
    this.useTokenCoin = isCoin ? 1 : 0;
    this.setData({
      isPreview: false,
    });
    try {
      await this.updateOrderPreview();
    } catch (e) {
      this.selectComponent('#discountRef').useDisable();
    }
    this.selectComponent('#discountRef').useDisable();
  },



  /**打开充电说明 */
  openChargPower() {
    this.setData({
      isShowChargPower: true,
    });
  },
  onCloseCharPower() {
    this.setData({
      isShowChargPower: false,
    });
  },
});