const app = getApp();
const ORDER_BOOT_TIMEOUT = 10;
const {
  countDown
} = app.globalData.utils.core;
const moment = app.globalData.utils.moment;

Component({
  mixins: [],
  data: {
    stop: true,
    _payTime: 0,
    cancelTime: 0,
    time: 0,
    startTime: null,
  },

  properties: {
    orderDetail: {
      type: Object,
      value: {}
    },
  },

  attached() {
    let order = this.data.orderDetail;
    if (order) {
      let time = order.appointmentOrder ?
        moment(order.appointmentOrder.startTime).format('M月DD日H点mm分') :
        '';
      let showerTime = order.appointmentOrder ?
        moment(order.appointmentOrder.expireTime).format('M月DD日H点mm分') :
        '';
      this.setData({
        startTime: order.appointmentOrder.appointType === 'SERVER_ONLY' ?
          time :
          showerTime,
      });
      this.payTimeCountDown(order.appointmentOrder.createTime);
      this.changeTime(order.appointmentOrder.startTime);
    }
  },

  detached() {},
  methods: {
    payTimeCountDown(time = 0) {
      let subTime = countDown(time);
      let payTime = 60 - subTime;
      this.setData({
        _payTime: payTime,
      });
    },
    handleCountDown(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          _payTime: 0,
        });
      }
    },
    changeTime(time = 0) {
      let subTime = countDown(time);
      let payTime = subTime < 0 ? -subTime : 0;
      this.setData({
        cancelTime: payTime,
      });
    },

    //结束订单
    stopShowerOrder(e) {
      let orderId = e.currentTarget.dataset.id;
      wx.showModal({
        title: '强制结束',
        content: ' 您确定要强制结束该订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            this.orderRemoteEnd(orderId);
          }
        },
      });
    },

    //强制结束该订单
    orderRemoteEnd(orderId) {
      app
        .$post('shower/appoint/underway/order/remoteEnd', {
          orderId: orderId,
        })
        .then(res => {
          this.checkBoot(res);
        });
    },

    //查看是否有回码
    checkBoot(msgId) {
      setTimeout(_ => {
        if (this.time > ORDER_BOOT_TIMEOUT) {
          wx.showToast({
            icon: 'success',
            title: '结束失败',
          });
          this.setData({
            stop: true,
          });
          return;
        }
        app.$post('machine/sync', {
          msgId: msgId
        }).then(res => {
          if (res) {
            wx.showToast({
              icon: 'success',
              title: '结束成功',
            });
            this.setData({
              stop: false,
            });
            return;
          }
          this.time++;
          this.checkBoot(msgId, this.time);
        });
      }, 1000);
    },

    //取消预约订单
    cancelPreviewOrder(e) {
      let id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '取消预约',
        content: '您确定要取消预约么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app
              .$post('shower/appoint/cancel', {
                appointOrderId: id
              })
              .then(e => {
                wx.showToast({
                  title: '已取消',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    wx.navigateBack();
                  },
                });
              });
          }
        },
      });
    },

    delPreviewOrder(e) {
      let id = e.currentTarget.dataset.id;
      wx.showModal({
        title: '删除订单',
        content: '您确定要删除订单么？',
        confirmText: '是的',
        cancelText: '暂不',
        success: result => {
          if (result.confirm) {
            app
              .$post('shower/appoint/delete', {
                appointOrderId: id
              })
              .then(e => {
                wx.showToast({
                  title: '已删除',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    wx.navigateBack();
                  },
                });
              });
          }
        },
      });
    },

    //取消订单
    handleCancelOrder() {
      let orderId = this.data.orderDetail.order ?
        this.data.orderDetail.order.id :
        null;
      wx.showModal({
        title: '提示',
        content: '距预约时间1个小时前可取消订单，取消后付款金额原路退回您的账户，已使用的优惠券和VIP权益不返还，确认取消？',
        confirmText: '确认取消',
        cancelText: '再想想',
        success: result => {
          if (result.confirm) {
            app
              .$post('order/reserve/cancelNew', {
                orderId: orderId
              })
              .then(_ => {
                wx.showToast({
                  title: '已取消',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    wx.navigateBack();
                  },
                });
              });
          }
        },
      });
    },
    //立即支付
    handlePay() {
      this.triggerEvent('payment', null);
    },
  },
});