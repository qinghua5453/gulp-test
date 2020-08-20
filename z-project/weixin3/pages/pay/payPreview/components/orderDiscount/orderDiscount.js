const app = getApp();
const {
  moment,
  log
} = app.globalData.utils;

Component({
  mixins: [],
  timeMarketId: null,
  memberVipCardId: null,
  isDisable: false,
  data: {
    timeMarket: null,
    isTimeMarket: false,
    vipCard: null,
    discount: 0,
    expireDate: 0,
    isVipCard: false,
    newCheckedCoupon: null,
    checkedCoupon: null,
    canUserCoupon: [],
    tokenCoin: null,
    isCoin: false,
    newOrderDetail: null,
    canNewUserCoupon: null,
  },
  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },
  attached() {
    this.initData(this.data.orderDetail);
  },

  detached() {},
  observers: {
    'orderDetail': function(orderDetail) {
      this.initData(orderDetail);
    },
  },
  methods: {
    initData(res) {
      this.setData({
        timeMarket: res.timeMarketPromotionDiscount,
        vipCard: res.vipCardPromotionDiscount,
        checkedCoupon: res.voucherPromotionDiscount,
        newCheckedCoupon: res.couponDiscount,
        tokenCoin: res.tokenCoinPromotionDiscount,
        isCoin: res.tokenCoinPromotionDiscount ?
          res.tokenCoinPromotionDiscount.isUsed :
          false,
      });
      //用户可用老优惠券
      const voucherPromotionDiscount = res.voucherPromotionDiscount;
      if (
        voucherPromotionDiscount &&
        voucherPromotionDiscount.voucherUserUsageVos &&
        voucherPromotionDiscount.voucherUserUsageVos.length > 0
      ) {
        const canCoupon = [];
        voucherPromotionDiscount.voucherUserUsageVos.forEach((item) => {
          if (item.available) {
            canCoupon.push(item);
          }
        });
        this.setData({
          canUserCoupon: canCoupon,
        });
      }
      //用户可用新优惠券
      if (
        res.couponDiscount &&
        res.couponDiscount.allActivationAssetDiscounts &&
        res.couponDiscount.allActivationAssetDiscounts.length > 0
      ) {
        this.setData({
          canNewUserCoupon: res.couponDiscount.allActivationAssetDiscounts,
        });
      }
      this.showExpireDate(); //显示vip过期时间
      this.setDefaultValue();
      if (res.shopVipCard && res.vipCardPromotionDiscount === null) {
        this.getshopVip(res.shopId);
      }
    },

    //默认选中vip或者限时特惠
    setDefaultValue() {
      if (this.data.timeMarket && this.data.timeMarket.isUsed) {
        this.timeMarketId = this.data.timeMarket.promotionId;
        this.memberVipCardId = null;
        this.setData({
          isTimeMarket: true,
          isVipCard: false,
        });
      } else if (this.data.vipCard && this.data.vipCard.isUsed) {
        this.timeMarketId = null;
        this.memberVipCardId = this.data.vipCard.promotionId;
        this.setData({
          isVipCard: true,
          isTimeMarket: false,
        });
      }
    },
    //vip过期时间
    showExpireDate() {
      if (this.data.vipCard) {
        let currentTime = moment(new Date()).format('YYYY-MM-DD 00:00:00');
        let _currentTime = new Date(currentTime.replace(/\s/, 'T')).getTime();
        let cardTime = moment(this.data.vipCard.maxAvailabletime).format(
          'YYYY-MM-DD 24:00:00'
        );
        let _cardTime = new Date(cardTime.replace(/\s/, 'T')).getTime();
        let _day = _cardTime - _currentTime;
        this.setData({
          expireDate: Math.floor(_day / 86400000) - 1,
        });
      }
    },

    //店铺vip折扣
    async getshopVip(shopId) {
      const res = await app.$post('shop/vip/list', {
        shopId
      });
      this.setData({
        discount: (res.cardDiscount * 10).toFixed(1),
      });
    },

    updateData() {
      this.triggerEvent('updatepaypreview', {
        isCoin: this.data.isCoin,
        timeMarketId: this.timeMarketId,
        memberVipCardId: this.memberVipCardId,
      });
    },

    //选中限时特惠
    ckTimeMarket() {
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      this.setData({
        isTimeMarket: !this.data.isTimeMarket,
      });
      if (this.data.isTimeMarket) {
        this.timeMarketId = this.data.timeMarket.promotionId;
        this.memberVipCardId = null;
        this.setData({
          isVipCard: false,
        });
      } else {
        this.timeMarketId = null;
      }
      this.updateData();
    },

    //选择金币
    ckTokenCoin() {
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      this.setData({
        isCoin: !this.data.isCoin,
      });
      this.updateData();
    },

    //选中VIP
    ckVipCard() {
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      this.setData({
        isVipCard: !this.data.isVipCard,
      });
      if (this.data.isVipCard) {
        this.memberVipCardId = this.data.vipCard.promotionId;
        this.timeMarketId = null;
        this.setData({
          isTimeMarket: false,
        });
      } else {
        this.memberVipCardId = null;
      }
      log
        .push({
          memberVipCardId: this.memberVipCardId ? this.memberVipCardId : 'false',
        })
        .done();
      this.updateData();
    },

    //进入选则新优惠券
    toNewChooseCoupon() {
      let couponActivationAssetId = this.data.newCheckedCoupon ?
        this.data.newCheckedCoupon.promotionId :
        null;
      let couponList = JSON.stringify(this.data.canNewUserCoupon);
      wx.navigateTo({
        url: `/pages/pay/newChooseCoupon/newChooseCoupon?couponList=${couponList}&couponActivationAssetId=${couponActivationAssetId}`,
      });
    },

    //进入开通店铺VIP
    toCreateVip() {
      wx.navigateTo({
        url: `/pages/vip/createVip/createVip?shopId=${this.data.orderDetail.shopId}`,
      });
    },

    //进入选择优惠券
    toChooseCoupon() {
      let couponId = this.data.checkedCoupon ?
        this.data.checkedCoupon.promotionId :
        null;
      let couponList = JSON.stringify(this.data.canUserCoupon);
      wx.navigateTo({
        url: `/pages/pay/chooseCoupon/chooseCoupon?couponList=${couponList}&couponId=${couponId}`,
      });
    },

    //购买金币
    toBuyCoin() {
      wx.navigateTo({
        url: `/user/recharge/buyGold/buyGold?shopId=${this.data.orderDetail.shopId}`,
      });
    },

    useDisable() {
      this.isDisable = false;
    },
  },
});