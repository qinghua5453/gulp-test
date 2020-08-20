const app = getApp();
const ORDER_PREPAY_TIMEOUT = 5; // 后付费订单支付状态超时时间

Page({
  payType: null,
  pathType: null,
  orderId: null,
  time: 1,
  data: {
    image: '',
    color: '',
    text: '',
    orderDetail: null,
    transition: false,
  },

  onLoad(res) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.pathType = res.pathType;
    this.payType = res.payType;
    this.orderId = res.orderId;
    this.getOrderDetail(res.orderId);
  },

  //获取订单详情
  getOrderDetail(orderId) {
    app.$post('order/detail', {
      orderId
    }).then(e => {
      this.setData({
        orderDetail: e,
      });
      this.getOrderStatus();
    });
  },

  //轮询支付状态
  getOrderStatus() {
    this.time++;
    app
      .$post(
        'order/sync', {
          orderNo: this.data.orderDetail.orderNo,
          payType: this.payType,
        },
        true
      )
      .then(resp => {
        if (resp.code === 0) {
          this.startSuccess();
          return;
        } else if (this.time > ORDER_PREPAY_TIMEOUT) {
          wx.redirectTo({
            url: `/pay/afterPay/paymentOrder/paymentOrder?id=${this.data.orderDetail.id}&pathType=1`,
          });
          return;
        } else {
          //根据支付方式展示样式
          switch (this.data.payType * 1) {
            case 1: //微信
              this.setData({
                image: 'https://static.qiekj.com/h5/pay/alipay-pay.gif',
                text: '支付确认中',
                color: '#2088FF',
                transition: true,
              });
              break;
            case 2: //余额
              this.setData({
                image: 'https://static.qiekj.com/h5/pay/balance-pay.gif',
                text: '支付确认中',
                color: '#2088FF',
                transition: true,
              });
              break;
          }
          setTimeout(() => {
            this.getOrderStatus();
          }, 1000);
        }
      })
      .catch(e => {
        this.setData({
          image: 'https://static.qiekj.com/h5/pay/balance-pay.gif',
          text: '支付确认中',
          color: '#2088FF',
        });
      });
  },

  // 支付成功
  startSuccess() {
    if (this.pathType * 1 === 1) {
      //生成订单页面过来
      wx.redirectTo({
        url: `/pages/order/orderDetail/orderDetail?orderId=${this.data.orderDetail.id}`,
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },
});