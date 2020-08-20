const app = getApp();
const {
  Bluetooth,
  Order
} = app.globalData;
const {
  log,
  Mapping,
  core
} = app.globalData.utils;
const {
  MachineType
} = Mapping;
const {
  countDown
} = core;

Component({
  orderNo: null,
  payType: null,
  isDisable: false,
  data: {
    startTime: 20,
    overTime: '',
    payTime: '', // 支付时间倒计时
    parentTypeId: 6, //机器状态
    handStart: null, //判断机器是否启动
    openBluetoothShow: false, //是否开启蓝牙
    showPaymentPopup: false,
    markMinutes: 0,
    charge: null,
    completeTime: 0,
    isLoading: false,
  },
  properties: {
    item: {
      type: Object,
      value: {}
    },
  },
  attached() {
    let res = this.data.item;
    if (Number(res.markMinutes) > 0) {
      switch (res.markUnit) {
        case 'h':
          res.markMinutes = res.markMinutes / 60;
          break;
        case 's':
          res.markMinutes = res.markMinutes * 60;
          break;
      }
    }
    this.setData({
      markMinutes: res.markMinutes,
      charge: res.charge,
    });
    this.orderNo = res.orderNo;
    this.payType = res.payType;
    this.setData({
      handStart: res.handStart,
      parentTypeId: MachineType[this.data.item.parentTypeId],
    });
    if (res.orderStatus === 0) {
      let subTime = countDown(res.createTime);
      this.setData({
        payTime: res.orderType === 5 ? 60 - subTime : 300 - subTime,
      });
    } else if (res.orderStatus === 2) {
      let subTime = res.completeTime ? countDown(res.completeTime) : 0;
      //机器启动倒计时20s,时间是否超过5分钟
      let timeoff = countDown(res.payTime);
      //机器工作时间的1/2
      let markTime = (res.markMinutes * 60) / 2 - timeoff;
      this.setData({
        completeTime: subTime > 0 ? 0 : -subTime,
        startTime: 20 - timeoff,
        overTime: markTime,
      });
    }
  },

  detached() {},
  methods: {
    //订单详情
    goOrderDetail(e) {
      let id = e.currentTarget.dataset.id;
      if (id) {
        wx.navigateTo({
          url: `/pages/order/orderDetail/orderDetail?orderId=${id}`,
        });
      }
    },
    //立即支付
    handlePay() {
      this.setData({
        showPaymentPopup: true,
      });
    },
    //后付费
    afterPay(e) {
      let id = e.currentTarget.dataset.id;
      if (id) {
        wx.navigateTo({
          url: `/pay/afterPay/paymentOrder/paymentOrder?id=${id}`,
        });
      }
    },
    closePayment() {
      this.setData({
        showPaymentPopup: false,
      });
    },
    // 正常订单的支付倒计时回调
    hanldePayTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          payTime: 0,
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
    //取消预约订单
    cancelPreviewOrder(e) {
      let orderId = e.currentTarget.dataset.id;
      wx.showModal({
        title: '取消预约',
        content: '您确定要取消预约么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app.$post('order/reserve/cancel', {
              orderId: orderId
            }).then(e => {
              wx.showToast({
                title: '已取消',
                icon: 'success',
                duration: 1000,
                success: () => {
                  wx.redirectTo({
                    url: '/pages/order/orderList/orderList',
                  });
                },
              });
            });
          }
        },
      });
    },
    //取消订单
    cancelOrder(e) {
      let orderId = e.currentTarget.dataset.id;
      wx.showModal({
        title: '取消订单',
        content: '您确定要取消订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app.$post('order/cancel', {
              orderId: orderId
            }).then(e => {
              wx.showToast({
                title: '已取消',
                icon: 'success',
                duration: 1000,
                success: () => {
                  wx.redirectTo({
                    url: '/pages/order/orderList/orderList',
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
      if (this.data.startTime > 0) {
        return;
      }
      if (this.isDisable) {
        return;
      }
      this.isDisable = true;
      log
        .push({
          type: 'orderlist_btn_click',
        })
        .done();
      //蓝牙模块&未开启蓝牙
      if (
        this.data.item.isBluetooth * 1 === 1 &&
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
              Order.boot(this.data.item, resp.messageId)
                .then(_ => {
                  this.isDisable = false;
                  this.setData({
                    isLoading: false,
                  });
                })
                .catch(e => {
                  this.isDisable = false;
                  wx.redirectTo({
                    url: `/pay/payment/machineError/machineError?orderId=${this.data.item.id}`,
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

    //蓝牙是否开启回调
    openShowBlueTooth(e) {
      this.isDisable = false;
      this.setData({
        openBluetoothShow: e.detail.status,
      });
    },
    /**
     * 删除订单
     */
    handleDelete(e) {
      let id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '删除订单',
        content: '您确定要删除订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app.$post('order/hidden', {
              orderId: id
            }).then(_ => {
              wx.showToast({
                title: '已删除',
                icon: 'success',
                duration: 1000,
                success: () => {
                  wx.redirectTo({
                    url: '/pages/order/orderList/orderList',
                  });
                },
              });
            });
          }
        },
      });
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
  },
});