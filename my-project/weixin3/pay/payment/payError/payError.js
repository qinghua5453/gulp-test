const app = getApp();
const {
  Order
} = app.globalData;

const ERRORTYPE = {
  MACHINE_ERROR: 1, //机器故障
  ORDER_ERROR: 2, //订单提交失败
  PAY_ERROR: 3, //扣款失败
};

Page({
  orderId: null,
  appointOrderId: null,
  data: {
    errorTitile: null,
    errorDesc: null,
    errorType: 3,
    errorImg: null,
    orderDetail: null,
    phoneText: '4006689966',
  },
  onLoad(options) {
    this.orderId = options.orderId;
    this.appointOrderId = options.appointOrderId;
    this.getOrderDetail();
    this.setData({
      errorType: Number(options.errorType),
    });
    const [errorType] = [Number(options.errorType)];
    wx.setNavigationBarTitle({
      title: errorType === ERRORTYPE.MACHINE_ERROR ?
        '连接超时' :
        errorType === ERRORTYPE.ORDER_ERROR ?
        '订单提交失败' :
        errorType === ERRORTYPE.PAY_ERROR ?
        '扣款失败' :
        ''
    });
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    });
    let desc =
      errorType === ERRORTYPE.MACHINE_ERROR ?
      '连接超时了' :
      errorType === ERRORTYPE.ORDER_ERROR ?
      '订单没有提交成功，请重新提交' :
      errorType === ERRORTYPE.PAY_ERROR ?
      '请前往企鹅共享小程序查看我的订单重新支付' :
      '';
    let imgUrl =
      errorType === ERRORTYPE.MACHINE_ERROR ?
      'connect_fail' :
      errorType === ERRORTYPE.ORDER_ERROR ?
      'order_fail' :
      errorType === ERRORTYPE.PAY_ERROR ?
      'deduction_fail' :
      '';
    this.setData({
      errorDesc: desc,
      errorImg: imgUrl,
    });
  },

  /**订单详情 */
  async getOrderDetail() {
    let res = await Order.getDetail(this.orderId);
    if (res) {
      this.setData({
        orderDetail: res,
        phoneText: res.operatorPhone || '4006689966',
      });
    }
  },
  makeCall() {
    let phonenumber = this.data.phoneText;
    wx.makePhoneCall({
      phoneNumber: phonenumber
    });
  },
  //订单详情
  goBack() {
    wx.navigateBack();
  },

  //订单列表
  goMyOrder() {
    if (this.appointOrderId) {
      wx.redirectTo({
        url: `/user/reserveOrder/reserveOrder`,
      });
      return;
    }
    wx.redirectTo({
      url: `/pages/order/orderList/orderList`,
    });
  },
});