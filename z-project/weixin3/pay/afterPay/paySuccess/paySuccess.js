const app = getApp();
Page({
  pathType: null,
  data: {
    orderDetail: null,
  },

  onLoad(res) {
    this.pathType = res.pathType;
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1578FF'
    });
    if (res.orderId) {
      this.getOrderDetail(res.orderId);
    }
  },

  /**订单详情 */
  async getOrderDetail(orderId) {
    let res = await app.$post('order/detail', {
      orderId
    });
    if (res) {
      this.setData({
        orderDetail: res,
      });
    }
  },

  /**返回至首页 */
  goHome() {
    const pages = getCurrentPages();
    if (this.pathType == 1) {
      wx.reLaunch({
        url: `/pages/home/home`,
      });
    } else {
      if (pages.length <= 1) {
        wx.reLaunch({
          url: `/pages/home/home`,
        });
        return;
      }
      wx.navigateBack();
    }
  },
});