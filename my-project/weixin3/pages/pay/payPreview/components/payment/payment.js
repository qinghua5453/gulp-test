const app = getApp();
const { Cache,Machine, Bluetooth } = app.globalData;
const { countDown } = app.globalData.utils.core;
const {moment,log} = app.globalData.utils;


Component({
  mixins: [],
  taskUrl: null,
  order: {},
  isBluetooth: 0, //是否支持蓝牙。0不支持，1支持
  orderNo: null,
  number: 0, //轮询次数
  isDisable: false,

  data: {
    promotion: 0,
    yunmaData: {
      task: false,
    },
    unimktTime: 59,
    isLoading: false,
    reserTime: 0,
    canUserCoupon: [],
    payPrice: 0,
    openBluetoothShow: false,
    isMachineStatus: false, //机器状态错误显示
    statusCode: null, //机器状态码
    balanceType: 1,
    balancePayShow: false, //余额支付弹窗
    orderId: null,
  },
  properties: {
    orderDetail: {
      type: Object,
      value: {},
    },
    paymentData:{
      type: Object,
      value: {},
    },
    payType: {
      type: Number,
      value: 3,
    }
  },
  attached() {
    if (this.data.orderDetail) {
      this.initData(this.data.orderDetail);
    }
  },
  observers: {
    orderDetail: function (orderDetail) {
      this.initData(orderDetail);
    },
  },

  detached() {},
  methods: {
    initData(res) {
      this.order = res;
      this.isDisable = false;
      this.number = 0;
      this.isBluetooth = Machine.privateData.isSupportBle ? 1 : 0;
      this.setData({
        payPrice: res.payPrice,
      });
      if (res && res.timeoutDate) {
        this.reserTimeCountDown(res.timeoutDate);
      }
      //用户可用老优惠券
      const voucherPromotionDiscount = res.voucherPromotionDiscount;
      if (
        voucherPromotionDiscount &&
        voucherPromotionDiscount.voucherUserUsageVos &&
        voucherPromotionDiscount.voucherUserUsageVos.length > 0
      ) {
        const canCoupon = [];
        voucherPromotionDiscount.voucherUserUsageVos.forEach((item) => {
          if (item.available) {
            canCoupon.push(item);
          }
        });
        this.setData({
          canUserCoupon: canCoupon,
        });
      }
    },
    reserTimeCountDown(time = 0) {
      let subTime = countDown(time);
      let payTime = 60 - subTime;
      this.setData({
        reserTime: payTime,
      });
    },
    handleReserCountDown(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        wx.showModal({
          showCancel: false,
          title: '温馨提示',
          content: '提交订单超时，请重新下单',
          confirmText: '我知道了',
          success: () => {
            wx.navigateBack();
          },
        });
      }
    },
    dyBtnDisable(isDisable, isLoading) {
      this.isDisable = isDisable;
      this.setData({
        isLoading: isLoading,
      });
    },
   
    //云码广告加载
    goTask() {
      let url = this.taskUrl || null;
      wx.ap.navigateToAlipayPage({
        path: encodeURIComponent(
          `https://render.alipay.com/p/h5/cloudcode-fe/redirect.html?target=${encodeURIComponent(
            url
          )}`
        ),
      });
    },
    //时间回调
    handleUnimktCountDown(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          'yunmaData.repeat': false,
        });
      }
    },
    //去支付
    submitOrder() {
      if(this.isDisable){
        return;
      }
      this.isDisable = true;
      this.setData({
        isLoading: true,
      });
      let payPrice = Number(this.order.payPrice);
      if(payPrice <= 0){
        this.setData({
          payType: 2
        })
      }
      this.getAliIotStatus();
    },
    //判断阿里状态
    async getAliIotStatus() {
      let res = await app.$post('machine/aliIotStatus', {
        machineId: this.order.machineId,
        reportState: 1,
      });
      if (!res) {
        return;
      }
      if (res.status == 1) {
        this.orderAdd();
      } else if (
        res.status == 2 &&
        this.isBluetooth === 1 &&
        (await Bluetooth.openBluetooth())
      ) {
        this.orderAdd();
      } else if (
        res.status == 2 &&
        this.isBluetooth === 1 &&
        !(await Bluetooth.openBluetooth())
      ) {
        this.setData({
          openBluetoothShow: true,
        });
        this.dyBtnDisable(false, false);
      } else {
        this.errorCode = res.status;
        let _status = {
          0: '4201',
          2: '4204',
          3: '4202',
          4: '4203',
        };
        let subCode = _status[res.status];
        this.setData({
          isMachineStatus: true,
          statusCode: subCode,
        });
        this.dyBtnDisable(false, false);
      }
    },
    //下单生成订单号
    async orderAdd() {
      if (!this.order) {
        return;
      }
      let timeMarket = this.order.timeMarketPromotionDiscount;
      let vipCard = this.order.vipCardPromotionDiscount;
      let checkedCoupon = this.order.voucherPromotionDiscount;
      let newCheckedCoupon = this.order.couponDiscount;
      let coinData = this.order.tokenCoinPromotionDiscount;
      let params = {
        machineFunctionId: this.order.machineFunctionId,
        appointOrderId: this.data.paymentData.appointOrderId
          ? this.data.paymentData.appointOrderId
          : null,
        memberVipCardId: vipCard && vipCard.isUsed ? vipCard.promotionId : null,
        timeMarketId:
          timeMarket && timeMarket.isUsed ? timeMarket.promotionId : null,
        voucherUserId:
          checkedCoupon && checkedCoupon.isUsed
            ? checkedCoupon.promotionId
            : null,
        useTokenCoin: coinData && coinData.isUsed ? '1' : '0',
        couponActivationAssetId:
          newCheckedCoupon && newCheckedCoupon.isUsed
            ? newCheckedCoupon.promotionId
            : null,
        skuIds: this.data.paymentData.skuIds ? this.data.paymentData.skuIds : null,
        useTime: this.data.paymentData.useTime ? this.data.paymentData.useTime : null,
      };
      let res = await app.$post('order/add', params);
      if (res) {
        if (res.subCode === 0) {
          log
            .push({
              addOrderParams: JSON.stringify(params),
              orderId: res.orderId,
            })
            .done();
          this.orderNo = res.orderNo;
          this.setData({
            orderId: res.orderId,
          });
          this.orderTradeNo(res.orderId);
        }
      } else {
        this.dyBtnDisable(false, false);
      }
    },
    //订单交易号
    async orderTradeNo(orderId) {
      let payload = {};
      let url = null;
      if (this.data.payType * 1 === 3) {
        url = 'wechat/miniapp/prepay';
        payload = {
          orderId,
          channel: 'wechat',
        };
      } else if (this.data.payType * 1 === 2) {
        url = 'pay/preBalance';
        payload = {
          orderId,
        };
      }
      let res = await app.$post(url, payload);
      log
      .push({
        tradeNoParams: JSON.stringify(payload),
        tradeDetail: JSON.stringify(res),
      })
      .done();
      if (res) {
        this.setData({
          balanceType: res.type || 1,
        });
        this.getMachineStatus(res, 10);
      } else {
        this.goOrderDetail();
      }
    },
    //轮询机器状态
    async getMachineStatus(tradeDetail, timeOut) {
      if (this.isBluetooth === 1 && (await Bluetooth.openBluetooth())) {
        this.handlePay(tradeDetail);
        return;
      }
      this.number++;
      if (tradeDetail.messageId) {
        let res = await app.$post('machine/sync', {
          msgId: tradeDetail.messageId,
        });
        if (res) {
          //去支付
          this.handlePay(tradeDetail);
        } else {
          if (this.number < timeOut) {
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
        machineId: this.order.machineId,
      });
      if (res && res.status * 1 === 1) {
        //去支付
        this.handlePay(tradeDetail);
      } else {
        this.goPaymentError(1);
      }
    },
    //去支付
    handlePay(resp) {
      this.dyBtnDisable(true, false);
      let payPrice = Number(this.order.payPrice);
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
                this.goPaymentSuccess();
              }
            },
            fail: (err) => {
              if(err.errMsg==="requestPayment:fail cancel"){
                this.goOrderDetail();
              }else{
                this.goPaymentError(3);
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
    // go orderDetail
    goOrderDetail() {
      if (this.data.paymentData.appointOrderId) {
        wx.redirectTo({
          url: `/shower/showerOrderDetail/showerOrderDetail?appointOrderId=${this.data.paymentData.appointOrderId}`,
        });
        return;
      }
      wx.redirectTo({
        url: `/pages/order/orderDetail/orderDetail?orderId=${this.data.orderId}`,
      });
    },
    //蓝牙是否开启弹窗回调
    openShowBlueTooth(e) {
      this.setData({
        openBluetoothShow: e.detail.status,
      });
    },
    
    //余额支付关闭回调
    balancePayClose() {
      this.setData({
        balancePayShow: false,
      });
      this.goOrderDetail();
    },

    /**余额支付成功 */
    balancePaySuccess() {
      this.setData({
        balancePayShow: false,
      });
      this.goPaymentSuccess();
    },

    /**余额支付失败 */
    balancePayError() {
      this.setData({
        balancePayShow: false,
      });
      this.goPaymentError(3);
    },

    /**支付成功 */
    goPaymentSuccess() {
      if (this.data.paymentData.appointOrderId) {
        wx.redirectTo({
          url: `/reservation/result/result?status=1&appointOrderId=${this.data.paymentData.appointOrderId}`,
        });
      } else {
        wx.redirectTo({
          url: `/pay/payment/paySuccess/paySuccess?orderId=${this.data.orderId}`,
        });
      }
    },

    /**支付出错 */
    goPaymentError(type = 1) {
      //type 1 连接超时 2 订单提交失败 3 扣款失败
      wx.redirectTo({
        url: `/pay/payment/payError/payError?errorType=${type}&orderId=${this.data.orderId}&appointOrderId=${this.data.paymentData.appointOrderId}`,
      });
    },
  },
});
