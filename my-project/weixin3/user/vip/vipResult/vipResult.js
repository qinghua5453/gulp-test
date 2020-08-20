const app = getApp();
const PAYTYPE = {
  ALIPAY: 'ALIPAY',
  WECHAT: 'WECHAT',
  BALANCE: 'BALANCE',
};

Page({
  payType: PAYTYPE.WECHAT,
  orderId: null,
  isDisable: false,

  data: {
    orderDetail: null,
    balancePayShow: false, //余额支付弹窗
    isTokenCoin: null,
  },
  onLoad(options) {
    this.orderId = options.orderId;
    this.setData({
      isTokenCoin: options.isTokenCoin,
    });
    this.getOrdervipDetail();
  },

  async getOrdervipDetail() {
    let res = await app.$post('order/vip/detail', {
      orderId: this.orderId,
    });
    res.discount = Number(res.discount * 10).toFixed(1);
    this.setData({
      orderDetail: res,
    });
  },

  handlePay() {
    if(this.isDisable){
      return;
    }
    this.isDisable = true;
    this.getTradeNO();
  },

  getTradeNO() {
    if (this.payType === PAYTYPE.WECHAT) {
      app
        .$post('wechat/miniapp/prepay', {
          orderId: this.data.orderDetail.id,
          channel: 'wechat',
        })
        .then((resp) => {
          this.isDisable = false;
          wx.requestPayment({
            timeStamp: resp.timeStamp || '',
            nonceStr: resp.nonceStr || '',
            package: resp.package || '',
            signType: resp.signType || 'MD5',
            paySign: resp.paySign || '',
            success: (res) => {
              if (res.errMsg === 'requestPayment:ok') {
                let orderType = this.data.orderDetail.orderType,
                  shopId = this.data.orderDetail.shopId;
                wx.redirectTo({
                  url: `/user/vip/createSuccess/createSuccess?orderType=${orderType}&shopId=${shopId}`,
                  success: () => {
                    this.isDisable = false;
                  },
                });
              }
            },
            fail: (err) => {
              
            },
          });
        });
    } else if (this.payType === PAYTYPE.BALANCE) {
      this.isDisable = false;
      this.setData({
        balancePayShow: true,
      });
    }
  },

  setPayType(e) {
    if (this.payType === e.detail.payType) {
      return;
    }
    if(e.detail.payType === PAYTYPE.ALIPAY){
      this.payType = PAYTYPE.WECHAT;
      return;
    }
    this.payType = e.detail.payType;
  },

  /**余额支付成功回调 */
  balancePaySuccess(data) {
    let [orderType, shopId] = [
      this.data.orderDetail.orderType,
      this.data.orderDetail.shopId,
    ];
    wx.redirectTo({
      url: `/user/vip/createSuccess/createSuccess?orderType=${orderType}&shopId=${shopId}`,
    });
  },

  /**余额支付弹窗关闭回调 */
  closeBalancePay() {
    this.setData({
      balancePayShow: false,
    });
  },
});
