const app = getApp();
const { User } = app.globalData;

Page({
  orderId: null, //订单id
  userBalance: 0,
  userAstrictBalance: 0,
  isDisable: false,

  data: {
    orderDetail: null, //订单信息
    balancePayShow: false, //余额支付弹窗
    payType: 3,
    isLoading: false,
    totalBalance: 0, //用户总余额
    pathType: null,
    balanceType: 1,
    balanceData: null,
  },

  onLoad(options) {
    this.orderId = options.id;
    this.setData({
      pathType: options.pathType,
    });
  },

  async onShow() {
    await User.check();
    this.getOrderDetail();
  },

  /**订单详情 */
  async getOrderDetail() {
    let res = await app.$post('order/detail', {
      orderId: this.orderId,
    });
    this.setData({
      orderDetail: res,
    });
    await this.getUserBalance();
  },

  /**用户正常余额 */
  async getUserBalance() {
    let res = await app.$post('user/info');
    this.userBalance = Number(res.balance);
    await this.getUserAstrictBalance();
  },

  /**用户受限余额 */
  async getUserAstrictBalance() {
    let res = await app.$post('user/astrict/residue', {
      orderId: this.orderId,
    });
    if (res && res.remainCoin) {
      this.userAstrictBalance = Number(res.remainCoin);
    }
    //余额支付按钮是否展示
    let _totalBalance =
      Number(this.userBalance) + Number(this.userAstrictBalance);
    this.setData({
      totalBalance: _totalBalance.toFixed(2),
      'balanceData.userBalance': this.userBalance,
      'balanceData.userAstrictBalance': this.userAstrictBalance,
    });
  },

  /**立即支付 */
  async handleAfterPay() {
    if(this.isDisable){
      return;
    }
    this.isDisable = true;
    this.setData({
      isLoading: true,
    });
    let order_Id = this.orderId ? this.orderId : this.data.orderDetail.id;
    let payPrice = Number(this.data.orderDetail.payPrice);
    if(payPrice <= 0){
      this.setData({
        payType: 2
      })
    }
    let url = null;
    let payload = {};
    if (this.data.payType * 1 === 3) {
      url = 'wechat/miniapp/prepay';
      payload = {
        orderId: order_Id,
        channel: 'wechat',
      };
    } else if (this.data.payType * 1 === 2) {
      url = 'pay/preBalance';
      payload = {
        orderId: order_Id,
      };
    }
    app.$post(url, payload).then(res => {
      if (res) {
        this.isDisable = false;
        this.setData({
          balanceType: res.type || 1,
        });
        this.handlePay(res);
      }
    }).catch(_ => {
      this.isDisable = false;
    })
  },

  handlePay(resp) {
    this.setData({
      isLoading: false,
    });
    let payPrice = Number(this.data.orderDetail.payPrice);
    if (this.data.payType * 1 === 3) {
      if (!resp.tradeNo && payPrice <= 0) {
        this.setData({
          balancePayShow: true,
        });
      } else {
        wx.requestPayment({
          timeStamp: resp.timeStamp || '',
          nonceStr: resp.nonceStr || '',
          package: resp.package || '',
          signType: resp.signType || 'MD5',
          paySign: resp.paySign || '',
          success: (res) => {
            if (res.errMsg === 'requestPayment:ok') {
              this.paySuccess();
            }
          }
        });
      }
    } else if (this.data.payType * 1 === 2) {
      this.setData({
        balancePayShow: true,
      });
    }
  },

  paySuccess() {
    wx.redirectTo({
      url: `/pay/afterPay/paySuccess/paySuccess?orderId=${this.data.orderDetail.id}&pathType=${this.data.pathType}`,
    });
  },

  /**选择支付方式 */
  selectPayType(e) {
    this.setData({
      payType: e.detail.type,
    });
  },

  /**余额支付成功回调 */
  balanceSuccessPay() {
    this.paySuccess();
  },
  
  /**余额支付失败或关闭弹窗 */
  balanceErrorPay() {
    this.setData({
      balancePayShow: false,
    });
  },
});
