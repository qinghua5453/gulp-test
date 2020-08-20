const app = getApp();

Page({
  id: null,
  timer: null,
  data: {},

  onLoad(res) {
    this.id = res.id;
  },

  onShow() {
    this.addOrderSync();
  },

  //轮询订单号
  async addOrderSync() {
    let e = await app.$post('order/afterPay/creating', {
      orderNo: this.id,
    });
    if (e.orderId && e.orderStatus * 1 === 2) {
      wx.redirectTo({
        url: `/pages/order/orderDetail/orderDetail?orderId=${e.orderId}`,
      });
    } else if (e.orderId && e.orderStatus * 1 != 2) {
      this.toAfterPay(e.orderId);
    } else {
      this.timer = setTimeout(() => {
        this.addOrderSync();
      }, 1000);
    }
  },

  onUnload() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  //清除定时器
  onHide() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  },

  //生成订单
  toAfterPay(orderId) {
    //断开蓝牙连接
    wx.redirectTo({
      url: `/pay/afterPay/paymentOrder/paymentOrder?id=${orderId}&pathType=1`,
    });
  }
});