const app = getApp();
const moment = app.globalData.utils.moment;
const {
  countDown
} = app.globalData.utils.core;

Page({
  appointOrderId: null,
  expireTime: 0,
  data: {
    orderDetail: null,
    status: null,
    startTime: null,
    time: '',
    orgName: '001',
  },

  onLoad(options) {
    this.appointOrderId = options.appointOrderId;
    this.expireTime = options.expireTime;
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    this.setData({
      status: options.status,
    });
    this.getOrderDetail(options.appointOrderId);
  },

  onShow() {
    this.setData({
      time: this.expireTime ? this.expireCountDown(this.expireTime) : 0,
    });
  },

  expireCountDown(expireTime = 0) {
    let subTime = countDown(expireTime);
    const payTime = subTime > 0 ? 0 : -subTime;
    return payTime || 0;
  },

  /**
   * 预约订单详情
   */
  async getOrderDetail(appointOrderId) {
    let res = await app.$post('shower/appoint/detail', {
      appointOrderId
    });
    if (res) {
      let time = res.appointmentOrder ?
        moment(res.appointmentOrder.expireTime).format('M月DD日H点mm分') :
        '';
      this.setData({
        startTime: time,
        orderDetail: res,
      });
    }
  },

  /**
   * 取消预约
   */
  handleCancelOrder() {
    if (this.data.time <= 0) {
      wx.showToast({
        title: '预约已失效，请重新预约',
        icon: 'none',
        duration: 1000,
      });
      return;
    }
    let order = this.data.orderDetail;
    wx.showModal({
      title: '温馨提示',
      content: '取消后您将无法在预约时段使用\n确认要取消吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: result => {
        if (result.confirm) {
          app
            .$post('shower/appoint/cancel', {
              appointOrderId: order.appointmentOrder.id,
            })
            .then(_ => {
              this.setData({
                status: 302,
              });
            });
        }
      },
    });
  },
  /**
   * 重新预约
   */
  handleRenewMachine() {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2];
    prevPage.setData({
      isRefresh: true,
    });
    wx.navigateBack({
      delta: 1,
    });
  },
  /**
   * 查看预约订单详情
   */
  goOrderDetail() {
    let order = this.data.orderDetail;
    wx.redirectTo({
      url: `/shower/showerOrderDetail/showerOrderDetail?appointOrderId=${order.appointmentOrder.id}`,
    });
  },
  handleCountDown(e) {
    let time = e.detail.countdown;
    if (time <= 0) {
      this.setData({
        time: 0,
      });
    }
  },
});