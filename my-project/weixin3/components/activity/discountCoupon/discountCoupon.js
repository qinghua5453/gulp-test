const app = getApp();
const moment = app.globalData.utils.moment;
Component({
  data: {
    isShowNoviceMeet: false, // 见面礼活动
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
      if (this.data.actResultcode === 0) {
        if (
          this.data.actResult.items &&
          this.data.actResult.items.length > 0
        ) {
          let list = this.data.actResult.items.sort(this.sortNum);
          list.map(function(item, index) {
            this.setData({
              ['discouponList[' + index + '].type']: item.type,
              ['discouponList[' + index + '].sweepstakes.startDate']: moment(
                item.sweepstakes.startDate
              ).format('YYYY.MM.DD'),
              ['discouponList[' + index + '].sweepstakes.endDate']: moment(
                item.sweepstakes.endDate
              ).format('YYYY.MM.DD'),
              ['discouponList[' + index + '].sweepstakes.faceValue']: (
                item.sweepstakes.faceValue * 10
              ).toFixed(0),
            });
          });
        }
        this.setData({
          isShowNoviceMeet: true,
        });
        this.triggerEvent('finish', this.data.isShowNoviceMeet);
      } else {
        this.setData({
          isShowNoviceMeet: false,
        });
        this.triggerEvent('finish', this.data.isShowNoviceMeet);
      }
    },

    // 数组排序
    sortNum(a, b) {
      //排序方法
      return a.sweepstakes.faceValue - b.sweepstakes.faceValue;
    },
    // 关闭弹窗
    closeCouponDialog() {
      this.setData({
        isShowNoviceMeet: false,
      });
      this.triggerEvent('finish', this.data.isShowNoviceMeet);
    },
    // 进入钱包查看
    goWallet() {
      wx.navigateTo({
        url: '/pages/wallet/walletList/walletList',
      });
    },
  },
});