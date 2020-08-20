const app = getApp();

Page({
  appointOrderId: '',
  data: {
    orderDetail: null,
    showPaymentPopup: false,
    isShowMore: false,
    resourceId: 'AD_20200709000000100032',
  },

  onLoad(option) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    this.appointOrderId = option.appointOrderId;
  },

  onShow() {
    this.getOrderDetail();
  },

  /**复制 */
  handleCopy() {
    let order = this.data.orderDetail;
    let copyText =
      order.appointmentOrder.appointType === 'SERVER_ONLY' ?
      order.appointmentOrder.goodsName :
      order.bathRoom.orgName;
    wx.setClipboardData({
      data: copyText,
    });
  },

  async getOrderDetail() {
    let res = await app.$post('shower/appoint/detail', {
      appointOrderId: this.appointOrderId,
    });
    this.setData({
      orderDetail: res,
    });
  },

  /**去支付 */
  handelPayment() {
    this.setData({
      showPaymentPopup: true,
    });
  },

  /**关闭继续支付弹窗 */
  closePayment() {
    this.setData({
      showPaymentPopup: false,
    });
  },
  showMore() {
    this.setData({
      isShowMore: !this.data.isShowMore,
    });
  },
});