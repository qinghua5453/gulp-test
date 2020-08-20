const app = getApp();
Component({
  mixins: [],
  isDisable: false,
  data: {
    balanceShow: true,
  },
  properties: {
    orderId: {
      type: String,
      value: ''
    }, //订单id
    payPrice: {
      type: Number,
      value: 0
    }, //支付价格
    totalBalance: {
      type: Number,
      value: 0
    }, //用户总余额
    balanceType: {
      type: Number,
      value: 1
    },
  },
  attached() {},

  detached() {},
  methods: {
    /**余额支付 */
    async balancePay() {
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      let [orderId] = [this.data.orderId];
      let url =
        this.data.balanceType == 1 ? 'pay/withBalance' : 'pay/astrictBalance';
      app
        .$post(url, {
          orderId
        })
        .then(() => {
          this.setData({
            balanceShow: false,
          });
          this.triggerEvent('balancepaysuccess', null);
        })
        .catch(() => {
          this.isDisable = false;
          this.setData({
            balanceShow: false,
          });
          this.triggerEvent('balancepayerror', null);
        });
    },

    /**关闭余额支付弹窗 */
    balancePayClose() {
      this.isDisable = false;
      this.setData({
        balanceShow: false,
      });
      this.triggerEvent('balancepayclose', null);
    },
  },
});