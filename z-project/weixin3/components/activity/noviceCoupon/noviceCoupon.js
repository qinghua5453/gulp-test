const app = getApp();
const {
  moment
} = app.globalData.utils;
Component({
  mixins: [],
  data: {
    isShowNoviceMeet: false, // 新手券包
    couponData: {},
    actCode: null, //活动码
  },
  properties: {
    actResult: {
      type: String,
      value: ''
    },
  },
  attached() {
    this.getPrizeResult();
  },

  detached() {},
  methods: {
    // 获取活动结果
    getPrizeResult() {
      if (this.data.actResult.code === 0) {
        this.data.actResult.items.map(item => {
          if (item.type === 5) {
            item.sweepstakes.startDate = moment(
              this.data.actResult.items[0].sweepstakes.startDate
            ).format('YYYY.MM.DD');
            item.sweepstakes.endDate = moment(
              this.data.actResult.items[0].sweepstakes.endDate
            ).format('YYYY.MM.DD');
            item.sweepstakes.faceValue = item.sweepstakes.faceValue * 10;
            this.setData({
              isShowNoviceMeet: true,
              couponData: item.sweepstakes,
            });
          }
        });
      } else {
        this.setData({
          isShowNoviceMeet: false,
        });
      }
    },

    // 关闭弹窗
    closeCouponDialog() {
      this.setData({
        isShowNoviceMeet: false,
      });
    },
  },
});