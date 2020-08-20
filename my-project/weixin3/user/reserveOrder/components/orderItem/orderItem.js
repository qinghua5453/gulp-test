const app = getApp();
const {
  countDown
} = app.globalData.utils.core;
Component({
  mixins: [],
  data: {
    payTime: 0,
    reserTime: 0,
    cancelTime: 0,
    showPaymentPopup: false,
  },
  properties: {
    item: {
      type: Object,
      value: {}
    },
  },
  attached() {
    if (this.data.item) {
      let _item = this.data.item;
      this.setData({
        payTime: this.payCountDown(_item.appointmentOrder.expireTime),
        reserTime: this.payCountDown(_item.appointmentOrder.createTime, 2),
        cancelTime: this.changeTime(_item.appointmentOrder.startTime),
      });
    }
  },

  detached() {},
  methods: {
    /**
     * 预约订单详情
     */
    goShowerOrderDetail(e) {
      let id = e.currentTarget.dataset.id;
      if (id) {
        wx.navigateTo({
          url: `/shower/showerOrderDetail/showerOrderDetail?appointOrderId=${id}`,
        });
      }
    },
    /**
     * 预约单取消
     */
    handleCancelOrder(e) {
      let orderId = e.currentTarget.dataset.id;
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
                    this.refreshPage();
                  },
                });
              });
          }
        },
      });
    },
    /**
     * 立即支付
     */
    handlePay() {
      this.setData({
        showPaymentPopup: true,
      });
    },
    closePayment() {
      this.setData({
        showPaymentPopup: false,
      });
    },
    /**
     * 淋浴订单取消预约
     */
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
              .then(_ => {
                wx.showToast({
                  title: '已取消',
                  icon: 'success',
                  duration: 1000,
                  success: () => {
                    this.refreshPage();
                  },
                });
              });
          }
        },
      });
    },
    /**
     * 淋浴订单删除
     */
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
                    this.refreshPage();
                  },
                });
              });
          }
        },
      });
    },
    refreshPage() {
      wx.redirectTo({
        url: '/user/reserveOrder/reserveOrder',
      });
    },
    payCountDown(createTime = '', type = 1) {
      let subTime = countDown(createTime);
      let payTime = type === 1 ? (subTime > 0 ? 0 : -subTime) : 60 - subTime;
      return payTime || '';
    },
    changeTime(createTime = '') {
      let subTime = countDown(createTime);
      let time = subTime < 0 ? -subTime : subTime;
      return time || '';
    },
    hanldePayTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          payTime: 0,
        });
      }
    },
    handleReserTime(e) {
      let time = e.detail.countdown;
      if (time <= 0) {
        this.setData({
          reserTime: 0,
        });
      }
    },
  },
});