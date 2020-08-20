const app = getApp();
const {
  User
} = app.globalData;
const {
  MachineType
} = app.globalData.utils.Mapping;
const {
  countDown,
  formatHourDuration
} = app.globalData.utils.core;

Page({
  orderId: null,
  time: 0,
  data: {
    resourceId: 'AD_20200709000000100032',
    orderDetail: null,
    parentTypeId: null, //机器类型
    isShowCharg: false, //是否展示充电桩信息
    tokenCoinNumber: 0,
    chargeTimeDesc: '', //充电时长
    showPaymentPopup: false, //展示支付弹窗
    phoneText: '4006689966',
    isShowMore: false,
  },

  onLoad(res) {
    this.orderId = res.orderId;
  },

  async onShow() {
    await User.check();
    this.getOrderDetail(this.orderId);
  },

  async getOrderDetail(id) {
    let res = await app.$post('order/detail', {
      orderId: id
    });
    if (!res) {
      return;
    }
    //友盟统计
    wx.uma.trackEvent('order_detail_count');
    //解锁时间转化
    let reg = /(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/g;
    let formatDate =
      res.orderNo && res.orderNo.length === 22 ?
      res.orderNo.substring(2, 16) :
      null;
    res.unlockTime = formatDate ?
      formatDate.replace(reg, '$1-$2-$3 $4:$5:$6') :
      null;
    //工作时间
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
      orderDetail: res,
      phoneText: res.operatorPhone || '4006689966',
      parentTypeId: MachineType[res.parentTypeId],
      tokenCoinNumber: res.tokenCoinDiscount ?
        Number(res.tokenCoinDiscount * 100).toFixed(0) :
        0,
    });
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    //充电桩
    if (res.charge) {
      let charge = res.charge;
      if (charge.state * 1 === 2) {
        wx.setNavigationBarColor({
          frontColor: '#ffffff',
          backgroundColor: '#FF8B36'
        });
      }
      let subTime = countDown(charge.completeTime);
      let time = subTime > 0 ? 0 : -subTime;
      this.setData({
        chargData: charge,
        chargeTimeDesc: formatHourDuration(time),
      });
      if (
        charge.state * 1 === 5 ||
        charge.state * 1 === 6 ||
        charge.state * 1 === 7 ||
        charge.state * 1 === 8
      ) {
        this.setData({
          isShowCharg: false,
        });
      } else {
        this.setData({
          isShowCharg: true,
        });
      }
    }
  },

  /**复制 */
  handleCopy() {
    wx.setClipboardData({
      data: this.data.orderDetail.machineName,
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

  makeCall() {
    let phonenumber = this.data.phoneText;
    wx.makePhoneCall({
      phoneNumber: phonenumber
    });
  },

  showMore() {
    this.setData({
      isShowMore: !this.data.isShowMore,
    });
  },
});