const app = getApp();
const {
  countDown
} = app.globalData.utils.core;

Component({
  mixins: [],

  data: {
    payTime: 0,
  },

  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },

  attached() {
    let order = this.data.orderDetail;
    if (order) {
      this.payTimeCountDown(order.createTime);
    }
  },

  detached() {},
  methods: {
    payTimeCountDown(time = 0) {
      let subTime = countDown(time);
      let payTime = 60 - subTime;
      this.setData({
        payTime: payTime,
      });
    },
    hanldeCountDown(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          payTime: 0,
        });
      }
    },
  },
});