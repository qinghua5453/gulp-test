const app = getApp();
const {
  moment
} = app.globalData.utils;
Component({
  mixins: [],
  data: {
    eventStatus: null, // 活动状态
    actList: [], // 奖品列表
    couponData: {}, // 领取成功信息
    isShowCoupon: false,
    isShowResult: false, // 领取结果页
    actCode: null, //活动code
  },
  properties: {
    shopId: {
      type: String,
      value: ''
    },
    machineId: {
      type: String,
      value: ''
    },
    orderId: {
      type: String,
      value: ''
    },
    eventCodes: {
      type: String,
      value: ''
    },
  },
  attached() {
    //获取活动码
    let _codes = this.data.eventCodes.paySuccessDrow.join(',');
    this.setData({
      actCode: _codes,
    });
    this.getSweepStakesStatus();
  },

  detached() {},
  methods: {
    // 获取活动状态
    getSweepStakesStatus() {
      app
        .$post('sweepstakes/status', {
          eventCodes: this.data.actCode,
          shopId: this.data.shopId,
          machineId: this.data.machineId,
        })
        .then(e => {
          if (e.eventStatus === 1) {
            this.getSweepStakesPrizeList();
          }
        });
    },

    // 获取活动列表
    getSweepStakesPrizeList() {
      app
        .$post('sweepstakes/prize/list', {
          eventCodes: this.data.actCode,
          shopId: this.data.shopId,
          machineId: this.data.machineId,
        })
        .then(e => {
          this.setData({
            actCode: e.eventCode,
          });
          if (e.code === 0) {
            // 没有领过
            this.setData({
              isShowCoupon: true,
              isShowResult: false,
            });
            if (e.items && e.items.length > 0) {
              e.items = e.items.map(item => {
                if (item.type === 5) {
                  item.sweepstakes.faceValue = (item.sweepstakes.faceValue * 10)
                    .toFixed(1)
                    .toString();
                }
                let faceValueList = item.sweepstakes.faceValue.split('.');
                let data = {
                  code: item.code,
                  id: item.id,
                  type: item.type,
                  sweepstakes: {
                    minGcoins: item.sweepstakes.minGcoins,
                    bigFaceValue: faceValueList[0],
                    smallFaceValue: faceValueList[1],
                  },
                };
                return data;
              });
              this.setData({
                actList: e.items,
              });
            }
          } else if (e.code === 1) {
            // 已经领过
            if (e.items && e.items.length > 0) {
              e.items.map(item => {
                if (item.code === 1) {
                  item.sweepstakes.startDate = moment(
                    item.sweepstakes.startDate
                  ).format('YYYY.MM.DD');
                  item.sweepstakes.endDate = moment(
                    item.sweepstakes.endDate
                  ).format('YYYY.MM.DD');
                  if (item.type === 5) {
                    item.sweepstakes.faceValue =
                      item.sweepstakes.faceValue * 10;
                  }
                  this.setData({
                    couponData: item,
                    isShowCoupon: false,
                    isShowResult: false,
                  });
                }
              });
            }
          }
        });
    },

    // 点击选我
    selectCoupon(e) {
      app
        .$post('sweepstakes/prize/result', {
          eventCode: this.data.actCode,
          prizeId: e.currentTarget.dataset.id,
          shopId: this.data.shopId,
          machineId: this.data.machineId,
        })
        .then(e => {
          e.items[0].sweepstakes.startDate = moment(
            e.items[0].sweepstakes.startDate
          ).format('YYYY.MM.DD');
          e.items[0].sweepstakes.endDate = moment(
            e.items[0].sweepstakes.endDate
          ).format('YYYY.MM.DD');
          if (e.items[0].type === 5) {
            e.items[0].sweepstakes.faceValue =
              e.items[0].sweepstakes.faceValue * 10;
          }
          this.setData({
            isShowCoupon: false,
            isShowResult: true,
            couponData: e.items[0],
          });
        });
    },
    // 关闭弹窗
    closeCouponDialog() {
      this.setData({
        isNewCoupon: false,
        isShowCoupon: false,
        isShowRecived: false,
        isShowResult: false,
        isTrue: false,
      });
    },
  },
});