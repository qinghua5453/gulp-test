const app = getApp();
Page({
  data: {
    list: null,
  },
  onShow() {
    this.appointOrderList();
  },

  //订单列表
  appointOrderList() {
    app.$post('shower/appoint/underway/orders').then(res => {
      if (res) {
        this.setData({
          list: res,
        });
      }
    });
  },

  //消费详情
  goShowerDetail(e) {
    let [orderId, orderType] = [
      e.currentTarget.dataset.id,
      e.currentTarget.dataset.type,
    ];
    let url =
      orderType === 0 ?
      `/shower/detail/detail?orderId=${orderId}&orderType=${orderType}` :
      `/shower/showerOrderDetail/showerOrderDetail?appointOrderId=${orderId}`;
    wx.navigateTo({
      url: url,
    });
  },
});