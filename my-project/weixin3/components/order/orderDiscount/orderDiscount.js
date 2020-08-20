Component({
  data: {
    tokenCoinNumber: 0,
  },
  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },
  attached() {
    if (this.data.orderDetail && this.data.orderDetail.tokenCoinDiscount) {
      let goldNumber = this.data.orderDetail.tokenCoinDiscount * 100;
      this.setData({
        tokenCoinNumber: parseFloat(goldNumber).toFixed(0),
      });
    }
  },

  detached() {},
  methods: {},
});