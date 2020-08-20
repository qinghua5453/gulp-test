const app = getApp();
const moment = app.globalData.utils.moment;

Component({
  mixins: [],
  data: {
    isShowNoviceMeet: false, //优惠券活动
    discouponList: [],
    actCode: null, //活动码
  },
  properties: {
    actResult: {
      type: String,
      value: ''
    },
    onFinish: {
      type: Function,
      value: data => {}
    },
  },
  attached() {
    this.getPrizeResult();
  },

  detached() {},
  methods: {
    // 获取活动结果
    getPrizeResult() {
      let that = this;
      if (that.data.actResult.code === 0) {
        wx.uma.trackEvent('user_coupon_count', {
          type: 'exposure'
        });
        that.setData({
          isShowNoviceMeet: true,
        });
        if (
          that.data.actResult.items &&
          that.data.actResult.items.length > 0
        ) {
          that.data.actResult.items.map(function(item, index) {
            that.setData({
              ['discouponList[' + index + '].type']: item.sweepstakes.type,
              ['discouponList[' + index + '].sweepstakes.startDate']: moment(
                item.sweepstakes.startDate
              ).format('YYYY.MM.DD'),
              ['discouponList[' + index + '].sweepstakes.endDate']: moment(
                item.sweepstakes.endDate
              ).format('YYYY.MM.DD'),
              ['discouponList[' + index + '].sweepstakes.faceValue']: item.sweepstakes.type == 3 ?
                (item.sweepstakes.faceValue * 10).toFixed(2) :
                (item.sweepstakes.faceValue * 1).toFixed(2),
              ['discouponList[' + index + '].sweepstakes.minGcoins']: item
                .sweepstakes.minGcoins,
            });
          });
        }
        that.triggerEvent('finish', that.data.isShowNoviceMeet);
      } else {
        that.setData({
          isShowNoviceMeet: false,
        });
        that.triggerEvent('finish', that.data.isShowNoviceMeet);
      }
    },

    // 关闭弹窗
    closeCouponDialog() {
      this.setData({
        isShowNoviceMeet: false,
      });
      this.triggerEvent('finish', this.data.isShowNoviceMeet);
    },
  },
});