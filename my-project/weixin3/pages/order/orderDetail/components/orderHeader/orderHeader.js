const app = getApp();
const {
  countDown,
  formatHourDuration
} = app.globalData.utils.core;

Component({
  mixins: [],

  data: {
    chargTime: 0,
    chargTimeDesc: null,
    payTime: '',
    completeTime: '',
  },

  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },

  attached() {
    if (this.data.orderDetail) {
      let res = this.data.orderDetail;
      if (res.orderStatus * 1 === 0) {
        let subTime = countDown(res.createTime);
        this.setData({
          payTime: Number(300 - subTime),
        });
      }
      if (res.charge) {
        let charge = res.charge;
        let subTime = countDown(charge.completeTime);
        let time = subTime > 0 ? 0 : -subTime;
        this.setData({
          chargTime: time,
          chargTimeDesc: formatHourDuration(time),
        });
      }
      if (res.orderStatus * 1 === 2) {
        let timeoff = countDown(res.payTime);
        let subTime = countDown(res.completeTime);
        //机器工作时间的1/2
        let markTime = (res.markMinutes * 60) / 2 - timeoff;
        this.setData({
          startTime: 20 - timeoff,
          overTime: markTime,
          completeTime: subTime > 0 ? 0 : -subTime,
        });
      }
    }
  },

  detached() {},
  methods: {
    // 支付时间倒计时回调
    hanldeCountDown(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          payTime: 0,
        });
      }
    },
    // 正常订单 支付完成倒计时
    hanldeComplete(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          completeTime: 0,
        });
      }
    },
    //充电桩倒计时
    hanldeChargeTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          chargTime: 0,
        });
      }
    },
  },
});