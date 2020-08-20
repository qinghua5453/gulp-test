const app = getApp();
const {
  countDown
} = app.globalData.utils.core;
const moment = app.globalData.utils.moment;

Page({
  appointOrderId: null,
  data: {
    orderDetail: null,
    status: 1, //订单状态 1 预约成功 2取消预约
    startTime: '',
    cancelTime: 0,
  },

  onLoad(options) {
    this.appointOrderId = options.appointOrderId;
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    this.getOrderDetail(options.appointOrderId);
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
        moment(res.appointmentOrder.startTime).format('M月DD日H点mm分') :
        '';
      this.changeTime(res.appointmentOrder.startTime);
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
    let order = this.data.orderDetail.order;
    let orderId = order.id || null;
    wx.showModal({
      title: '温馨提示',
      content: '取消后您将无法在预约时段使用\n确认要取消吗？',
      confirmText: '确定',
      cancelText: '取消',
      success: result => {
        if (result.confirm) {
          app.$post('order/reserve/cancelNew', {
            orderId: orderId
          }).then(_ => {
            this.setData({
              status: 2,
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
    wx.navigateBack();
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
  changeTime(time = 0) {
    let subTime = countDown(time);
    let payTime = subTime < 0 ? -subTime : 0;
    this.setData({
      cancelTime: payTime,
    });
  },
});