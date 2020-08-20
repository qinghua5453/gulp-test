const app = getApp();
const {
  countDown
} = app.globalData.utils.core;
const {
  Bluetooth,
  Order
} = app.globalData;
const {
  log
} = app.globalData.utils;

Component({
  mixins: [],
  orderNo: null,
  payType: null,
  isDisable: false,

  data: {
    payTime: '',
    completeTime: 0,
    startTime: 20,
    overTime: '', // 机器启动时间是否过了5分钟
    isShowDeleteCharg: false,
    handStart: null,
    charge: null,
    openBluetoothShow: false,
    isLoading: false,
  },

  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
    parentTypeId: {
      type: String,
      value: ''
    },
  },

  attached() {
    let order = this.data.orderDetail;
    this.orderNo = order.orderNo;
    this.payType = order.payType;
    this.setData({
      handStart: order.handStart,
      charge: order.charge,
    });
    //充电桩
    if (order.charge) {
      let charge = order.charge ? order.charge : null;
      if (charge.state * 1 === 0 || charge.state * 1 === 1) {
        this.setData({
          isShowDeleteCharg: false
        });
      } else {
        this.setData({
          isShowDeleteCharg: true
        });
      }
    }
    //订单未支付
    if (order.orderStatus * 1 === 0) {
      let subTime = order.createTime ? countDown(order.createTime) : 0;
      this.setData({
        payTime: order.orderType === 5 ? 60 - subTime : 300 - subTime,
      });
    }
    //订单已支付
    if (order.orderStatus * 1 === 2) {
      let subTime = order.completeTime ? countDown(order.completeTime) : 0;
      console.log('机器工作时间', subTime);
      let timeoff = order.payTime ? countDown(order.payTime) : 0;
      //机器工作时间的1/2
      let markTime = (order.markMinutes * 60) / 2 - timeoff;
      this.setData({
        completeTime: subTime > 0 ? 0 : -subTime,
        startTime: 20 - timeoff,
        overTime: markTime,
      });
    }
  },

  detached() {},
  methods: {
    // 取消订单
    handleCancelOrder() {
      wx.showModal({
        title: '取消订单',
        content: '您确定要取消订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app
              .$post('order/cancel', {
                orderId: this.data.orderDetail.id
              })
              .then(e => {
                wx.showToast({
                  title: '已取消',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    wx.navigateBack({
                      delta: 1,
                    });
                  },
                });
              });
          }
        },
      });
    },

    //删除订单
    handleDelete() {
      wx.showModal({
        title: '删除订单',
        content: '您确定要删除订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app
              .$post('order/hidden', {
                orderId: this.data.orderDetail.id
              })
              .then(_ => {
                wx.showToast({
                  title: '已删除',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    wx.navigateBack({
                      delta: 1,
                    });
                  },
                });
              });
          }
        },
      });
    },

    //启动机器
    async handleMachineBoot() {
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      log
        .push({
          type: 'order_btn_click',
        })
        .done();
      //蓝牙模块&未开启蓝牙
      if (
        this.data.orderDetail.isBluetooth * 1 === 1 &&
        !(await Bluetooth.openBluetooth())
      ) {
        this.setData({
          openBluetoothShow: true,
        });
        return;
      }
      this.setData({
        isLoading: true,
      });
      this.getOrderStatus();
    },

    async getOrderStatus() {
      app
        .$post('order/sync', {
          orderNo: this.orderNo,
          payType: this.payType,
        })
        .then(resp => {
          if (resp.code === 0) {
            if (resp.messageId == '') {
              this.setData({
                isLoading: false,
              });
            } else {
              //支持蓝牙且开通走蓝牙流程
              Order.boot(this.data.orderDetail, resp.messageId)
                .then(_ => {
                  this.isDisable = false;
                  this.setData({
                    isLoading: false,
                  });
                })
                .catch(e => {
                  this.isDisable = false;
                  wx.redirectTo({
                    url: `/pay/payment/machineError/machineError?orderId=${this.data.orderDetail.id}`,
                  });
                });
              return;
            }
          } else {
            setTimeout(() => {
              this.getOrderStatus();
            }, 1000);
          }
        });
    },

    //是否开启蓝牙回调
    openShowBlueTooth(data) {
      this.isDisable = false;
      this.setData({
        openBluetoothShow: data,
      });
    },

    //点击续充
    goRecharge() {
      app
        .$post('machine/function/listState', {
          machineId: this.data.orderDetail.machineId,
        })
        .then(res => {
          if (res) {
            let chargList = res.items;
            if (chargList) {
              let id = this.data.orderDetail.machineId;
              chargList.find(v => {
                return v.id == this.data.orderDetail.machineFunctionId;
              });
              wx.navigateTo({
                url: `/pages/chooseChargeMachine/chargeMachine/chargeMachine?machineId=${id}&channel=${this.data.charge.channel}`,
              });
            }
          }
        });
    },

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
    // 启动机器20s倒计时
    hanldeStart(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          startTime: 0,
        });
      }
    },
    // 机器启动时间超过5分钟回调
    hanldeOverTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          overTime: 0,
        });
      }
    },

    //立即支付
    handlePay() {
      this.triggerEvent('payment', null);
    },

    /**后付费支付 */
    handleAfterPay() {
      wx.navigateTo({
        url: `/pay/afterPay/paymentOrder/paymentOrder?id=${this.data.orderDetail.id}`,
      });
    },
  },
});