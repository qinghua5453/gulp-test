const app = getApp();
const {
  Order
} = app.globalData;
const {
  countDown
} = app.globalData.utils.core;
const {
  MachineType
} = app.globalData.utils.Mapping;

Page({
  orderId: null,
  payType: null,
  machineType: null,
  targetUrl: null, //目标跳转地址
  unimktType: 'cpa', //跳转类型
  data: {
    orderDetail: null,
    isCharge: true, //是否是充电桩
    machineTitle: null, //
    workStatus: 1, //工作状态 1 启动中 2工作中
    completeTime: null, //机器工作时间
    charge: null, //充电桩信息
    chargeCompleteTime: null, //充电桩剩余时间
    second: 0,
    isShowMore: false,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1976FF',
    });
    this.orderId = options.orderId;
    this.getOrderDetail(options.orderId);
  },

  getOrderDetail(orderId) {
    Order.getDetail(orderId).then(data => {
      this.payType = data.payType;
      this.machineType = MachineType[data.parentTypeId];
      let title = '使用中';
      switch (this.machineType) {
        case 1:
          title = '洗衣中';
          break;
        case 2:
          title = '烘干中';
          break;
        case 3:
          title = '洗鞋中';
          break;
      }
      this.setData({
        orderDetail: data,
        machineTitle: title,
        charge: data.charge || null,
      });
      if (data.completeTime) {
        let subTime = countDown(data.completeTime);
        let time = subTime > 0 ? 0 : -subTime;
        this.setData({
          completeTime: time,
        });
      }
      //充电桩
      if (data.charge) {
        let charge = data.charge;
        let subTime = countDown(charge.completeTime);
        let time = subTime > 0 ? 0 : -subTime;
        this.setData({
          chargeCompleteTime: time,
        });
      }
      this.getOrderStatus();
    });
  },

  async getOrderStatus() {
    app
      .$post('order/sync', {
        orderNo: Order.privateData.orderNo,
        payType: this.payType,
      })
      .then(resp => {
        if (resp.code === 0) {
          if (resp.messageId == '') {
            this.setData({
              workStatus: 2,
            });
          } else {
            //支持蓝牙且开通走蓝牙流程
            Order.boot(this.data.orderDetail, resp.messageId)
              .then(_ => {
                this.setData({
                  workStatus: 2,
                });
              })
              .catch(e => {
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
            wx.redirectTo({
              url: `/pages/chooseChargeMachine/chargeMachine/chargeMachine?machineId=${id}&channel=${this.data.charge.channel}`,
            });
          }
        }
      });
  },

  /**工作倒计时 */
  hanldeComplete(e) {
    let time = e.detail.countdown;
    if (time <= 0) {
      this.setData({
        completeTime: 0,
      });
    }
  },

  /**充电桩倒计时 */
  hanldeChargeComplete(e) {
    let time = e.detail.countdown;
    if (time <= 0) {
      this.setData({
        chargeCompleteTime: 0,
      });
    }
  },

  /**设备故障 */
  goMachineError() {
    wx.redirectTo({
      url: `/pay/payment/machineError/machineError?orderId=${this.data.orderDetail.id}`,
    });
  },

  /**订单详情 */
  goOrderDetail() {
    wx.redirectTo({
      url: `/pages/order/orderDetail/orderDetail?orderId=${this.data.orderDetail.id}`,
    });
  },

  //云码活动倒计时
  handleUniMakCountDown(e) {
    let time = e.detail.countdown;
    if (time <= 0) {
      this.setData({
        second: 0,
      });
      let promotionUrl = this.targetUrl || null;
      if (promotionUrl) {
        //统计自动跳转到CPA或者CPM结果页
        wx.uma.trackEvent('paysuccess_unimkt_count', {
          unimktType: this.unimktType,
        });
        wx.ap.navigateToAlipayPage({
          path: encodeURIComponent(
            `https://render.alipay.com/p/h5/cloudcode-fe/redirect.html?target=${encodeURIComponent(
              promotionUrl
            )}`
          ),
        });
      }
    }
  },

  goShowMore() {
    this.setData({
      isShowMore: !this.data.isShowMore,
    });
  },
});