const app = getApp();
const {
  countDown
} = app.globalData.utils.core;
const {
  Bluetooth
} = app.globalData;
Component({
  mixins: [],

  userBalance: 0, //用户余额
  userAstrictBalance: 0, //用户受限余额
  appointOrderId: null,
  isDisable:false,

  data: {
    isShowPaymentPopup: false,
    payType: 3,
    itemWx: 3,
    payTime: 0,
    isShowBalance: false, //是否展示余额支付
    isSupport: false, //是否支持余额支付
    isLoading: false,
    balancePayShow: false, //余额支付弹窗
    totalBalance: 0,
    balanceType: 1,
    number: 0, //轮询次数
  },
  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
    showPopup: {
      type: Boolean,
      value: false
    },
    appointmentOrder: {
      type: Object,
      value: {}
    }, //预约id
  },
  observers: {
    'showPopup': function(showPopup) {
      this.setData({
        isShowPaymentPopup: showPopup,
      });
    },
  },

  attached() {
    this.setData({
      isShowPaymentPopup: this.data.showPopup,
    });
    let order = this.data.orderDetail;
    let appointmentOrder = this.data.appointmentOrder;
    if (appointmentOrder) {
      this.appointOrderId = appointmentOrder.id;
    }
    //订单未支付
    if (order.orderStatus * 1 === 0) {
      let subTime = 0;
      if (appointmentOrder) {
        subTime = appointmentOrder.createTime ?
          countDown(appointmentOrder.createTime) :
          0;
      } else {
        subTime = order.createTime ? countDown(order.createTime) : 0;
      }
      this.setData({
        payTime: appointmentOrder ? 60 - subTime : 300 - subTime,
      });
    }
    this.getUserBalance();
  },

  detached() {},
  methods: {
    /**用户正常余额 */
    async getUserBalance() {
      let res = await app.$post('user/info');
      this.userBalance = Number(res.balance);
      await this.getUserAstrictBalance();
    },

    /**用户受限余额 */
    async getUserAstrictBalance() {
      let payPrice = Number(this.data.orderDetail.payPrice);
      let res = await app.$post('user/astrict/residue', {
        orderId: this.data.orderDetail.id,
      });
      if (res && res.remainCoin) {
        this.userAstrictBalance = Number(res.remainCoin);
      }
      //余额支付按钮是否展示
      let _totalBalance =
        Number(this.userBalance) + Number(this.userAstrictBalance);
      this.setData({
        totalBalance: _totalBalance,
      });
      if (payPrice <= 0 && _totalBalance <= 0) {
        this.setData({
          isShowBalance: false
        });
      } else {
        this.setData({
          isShowBalance: true
        });
        if (this.userBalance >= payPrice) {
          this.setData({
            isSupport: true,
          });
        } else if (this.userAstrictBalance >= payPrice) {
          this.setData({
            isSupport: true,
          });
        } else {
          this.setData({
            isSupport: false,
          });
        }
      }
    },

    /**选择支付方式 */
    selectPayType(e) {
      let type = Number(e.currentTarget.dataset.item);
      this.setData({
        payType: type
      });
    },

    /**支付 */
    async handlePayment() {
      if(this.isDisable){
        return;
      }
      this.isDisable = true;
      this.setData({
        isLoading: true,
      });
      let order = this.data.orderDetail;
      let orderId = order.id || null;
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
          orderId,
          channel: 'wechat',
        };
      } else if (this.data.payType * 1 === 2) {
        url = 'pay/preBalance';
        payload = {
          orderId: orderId
        };
      }
      let res = await app.$post(url, payload);
      if (res) {
        this.isDisable = false;
        this.setData({
          balanceType: res.type || 1,
        });
        this.getMachineStatus(res, 10);
      } else {
        this.isDisable = false;
        this.setData({
          isLoading: false,
        });
      }
    },

    //轮询机器状态
    async getMachineStatus(tradeDetail, timeOut) {
      let order = this.data.orderDetail;
      if (order.isBluetooth * 1 === 1 && (await Bluetooth.openBluetooth())) {
        this.handlePay(tradeDetail);
        return;
      }
      this.data.number++;
      if (tradeDetail.messageId) {
        let res = await app.$post('machine/sync', {
          msgId: tradeDetail.messageId,
        });
        if (res) {
          //去支付
          this.handlePay(tradeDetail);
        } else {
          if (this.data.number < timeOut) {
            setTimeout(() => {
              this.getMachineStatus(tradeDetail, timeOut);
            }, 1000);
          } else {
            this.payAliIotStatus(tradeDetail);
          }
        }
      } else {
        //去支付
        this.handlePay(tradeDetail);
      }
    },

    async payAliIotStatus(tradeDetail) {
      let res = await app.$post('machine/aliIotStatus', {
        machineId: this.data.orderDetail.machineId,
      });
      if (res && res.status * 1 === 1) {
        //去支付
        this.handlePay(tradeDetail);
      } else {
        this.goPaymentError(1);
      }
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
            },
            fail: (err) => {
              if(err.errMsg==="requestPayment:fail cancel"){
                this.goOrderDetail();
              }else{
                this.payError(3);
              }
            },
          });
        }
      } else if (this.data.payType * 1 === 2) {
        this.setData({
          balancePayShow: true,
        });
      }
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
      this.payError(3);
    },

    // go orderDetail
    goOrderDetail() {
      let url = '';
      if (this.appointOrderId) {
        url = `/shower/showerOrderDetail/showerOrderDetail?appointOrderId=${this.appointOrderId}`;
      } else {
        url = `/pages/order/orderDetail/orderDetail?orderId=${this.data.orderDetail.id}`;
      }
      wx.redirectTo({
        url: url,
      });
    },

    //余额支付关闭回调
    balancePayClose() {
      this.setData({
        balancePayShow: false,
      });
      this.goOrderDetail();
    },

    paySuccess() {
      if (this.appointOrderId) {
        wx.redirectTo({
          url: `/reservation/result/result?status=1&appointOrderId=${this.appointOrderId}`,
        });
        return;
      }
      wx.redirectTo({
        url: `/pay/payment/paySuccess/paySuccess?orderId=${this.data.orderDetail.id}`,
      });
    },

    payError(type = 1) {
      wx.redirectTo({
        url: `/pay/payment/payError/payError?errorType=${type}&orderId=${this.data.orderDetail.id}&appointOrderId=${this.appointOrderId}`,
      });
    },

    /**关闭支付弹窗 */
    closePaymentPopup() {
      this.setData({
        isShowPaymentPopup: false,
      });
      this.triggerEvent('closepaypopup', null);
    },

    /**支付倒计时回调 */
    handlePayTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          payTime: 0,
          isShowPaymentPopup: false,
        });
      }
    },

    /**支付出错 */
    goPaymentError(type = 1) {
      //type 1 连接超时 2 订单提交失败 3 扣款失败
      wx.redirectTo({
        url: `/pay/payment/payError/payError?errorType=${type}&orderId=${this.data.orderDetail.id}`,
      });
    },
  },
});