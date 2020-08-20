const app = getApp();
const ORDER_BOOT_TIMEOUT = 10; //查询回码
Page({
  orderId: null,
  orderType: null,
  time: 0,
  data: {
    showerData: null,
    isStop: true, //是否结束成功
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.orderId = options.orderId;
    this.orderType = options.orderType;
  },

  onShow() {
    this.showerOrderDetail();
  },

  //淋浴订单详情
  showerOrderDetail() {
    app
      .$post('shower/appoint/underway/order/detail', {
        orderId: this.orderId,
        orderType: this.orderType,
      })
      .then(res => {
        if (res) {
          this.setData({
            showerData: res,
          });
        }
      });
  },

  //强制结束
  stopOrder() {
    wx.showModal({
      title: '强制结束',
      content: ' 您确定要强制结束该订单么？',
      confirmText: '是的',
      cancelText: '暂不',
      success: result => {
        if (result.confirm) {
          this.orderRemoteEnd();
        }
      },
    });
  },

  //强制结束该订单
  orderRemoteEnd() {
    app
      .$post('shower/appoint/underway/order/remoteEnd', {
        orderId: this.orderId,
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
          isStop: true,
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
          wx.reLaunch({
            url: '/pages/home/home',
          });
          this.setData({
            isStop: false,
          });
          return;
        }
        this.time++;
        this.checkBoot(msgId, this.time);
      });
    }, 1000);
  },
});