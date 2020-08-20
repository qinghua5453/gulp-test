const app = getApp();
const {
  Cache,
  eventBus
} = app.globalData;

Component({
  data: {
    eventCodes: null,
    isShowUserVip: false,
    meetCouponStatus: null, //注册7天内未消活动状态
    discountCouponStatus: null, //企鹅暖冬活动状态
    userCouponStatus: null,
    isShowPop: false,
    actResult: null,
    activityList: null, //强制金币/免密
    showLoading: false,
  },
  properties: {
    machine: {
      type: Object,
      value: {}
    },
    machineId: {
      type: String,
      value: ''
    },
    noticeType: {
      type: Number,
      value: 0
    },
    chooseType: {
      type: Number,
      value: 1
    },
    onScrollShow: {
      type: Function,
      value: (data) => {}
    },
  },
  attached() {
    eventBus.on('refreshMarketActivity', () => {
      this.refresh(this.data.machine.shopId);
    });
  },
  detached() {
    eventBus.removeAllListeners('refreshMarketActivity');
  },
  methods: {
    refresh(shopId) {
      this.showEventStatus(shopId);
      this.getPopupShop(shopId);
      this.getSweepStatusCode();
    },
    //获取vip活动状态
    showEventStatus(shopId) {
      if (shopId) {
        app.$post('sweepstakes/vip/popup', {
          shopId
        }).then(e => {
          this.setData({
            isShowUserVip: e.code != 0 && e.userProperty != 0 && e.type != 0 ? true : false,
          });
        });
      }
    },
    //店铺弹窗
    async getPopupShop(shopId) {
      let res = await app.$post('popup/shop', {
        shopId: shopId,
        aspect: 1
      });
      if (!res || (res && res.length === 0)) {
        this.setData({
          activityList: null,
        });
        return;
      }

      let ends = (await Cache.get('CACHE_ACTIVITY')) || null;
      let arr = res.reverse();
      this.setData({
        activityList: arr,
        isEnds: ends,
      });
    },
    //获取活动码
    getSweepStatusCode() {
      app.$post('sweepstakes/codes').then(res => {
        this.getSweepStakesStatus(res);
        this.setData({
          eventCodes: res,
        });
      });
    },

    // 获取活动状态
    getSweepStakesStatus(res) {
      let meetCouponDataPromise = app.$post('sweepstakes/status', {
        eventCodes: res.chooseModeTwo.join(','),
        shopId: this.data.machine.shopId,
        machineId: this.data.machineId,
      });
      let discountDataPromise = app.$post('sweepstakes/status', {
        eventCodes: res.chooseModeThree.join(','),
        shopId: this.data.machine.shopId,
        machineId: this.data.machineId,
      });
      let userCouponDataPromise = app.$post('sweepstakes/status', {
        eventCodes: res.chooseModeCoupon.join(','),
        shopId: this.data.machine.shopId,
        machineId: this.data.machineId,
      });
      Promise.all([
        meetCouponDataPromise,
        discountDataPromise,
        userCouponDataPromise,
      ]).then(([meetCouponData, discountData, userCouponData]) => {
        let discountCouponStatus = discountData.eventStatus * 1,
          userCouponStatus = userCouponData.eventStatus * 1,
          meetCouponStatus = meetCouponData.eventStatus * 1;
        this.setData({
          discountCouponStatus,
          userCouponStatus,
          meetCouponStatus,
          isShowPop: userCouponStatus === 1 ||
            meetCouponStatus === 1 ||
            discountCouponStatus === 1 ?
            false :
            true,
        });
        console.log('this.data.isShowPop', this.data.isShowPop);
        console.log('this.data.isShowUserVip', this.data.isShowUserVip);
        if (userCouponStatus === 1) {
          this.getSweepResult(userCouponData.eventCode);
        } else if (meetCouponStatus === 1) {
          this.getSweepResult(meetCouponData.eventCode);
        } else if (discountCouponStatus === 1) {
          this.getSweepResult(discountData.eventCode);
        }
      });
    },

    //获取活动结果
    getSweepResult(eventCode) {
      app
        .$post('sweepstakes/prize/result', {
          eventCode: eventCode,
          shopId: this.data.machine.shopId,
          machineId: this.data.machineId,
        })
        .then(res => {
          this.setData({
            actResult: res,
            isShowPop: res.items && res.items.length > 0 ? false : true,
          });
        });
    },
  },
});