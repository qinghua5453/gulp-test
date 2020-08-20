const app = getApp();
const {
  countDown
} = app.globalData.utils.core;
const {
  MachineType
} = app.globalData.utils.Mapping;
const {
  Order,
  Machine,
  Bluetooth
} = app.globalData;
const {
  log
} = app.globalData.utils;

Page({
  orderId: null,
  payType: null,
  orderNo: null,
  isDisable: false,

  data: {
    orderDetail: null,
    overTime: 0,
    parentType: null,
    handStart: null, //判断是否启动过，1启动过，0或null没有启动过
    openBluetoothShow: false,
    errCode: null,
    operatorPhone: null,
    phoneText: '4006689966',
    isLoading: false,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      backgroundColor: '#ffffff',
      frontColor: '#000000'
    })
    this.orderId = options.orderId;
    this.getOrderDetail();
  },

  /**订单详情 */
  async getOrderDetail() {
    let res = await Order.getDetail(this.orderId);
    if (res) {
      this.payType = res.payType;
      this.orderNo = Order.privateData.orderNo;
      let subTime = countDown(res.payTime);
      let markTime = (res.markMinutes * 60) / 2 - subTime;
      this.setData({
        orderDetail: res,
        phoneText: res.operatorPhone || '4006689966',
        handStart: res.handStart,
        overTime: markTime,
        parentType: MachineType[res.parentTypeId],
        operatorPhone: res.operatorPhone,
      });
      await this.getMachineDetail(res.machineId);
    }
  },
  makeCall() {
    let phonenumber = this.data.phoneText;
    wx.makePhoneCall({
      phoneNumber: phonenumber
    });
  },
  /**机器详情 */
  async getMachineDetail(machineId) {
    try {
      await Machine.getDetail(machineId);
    } catch (e) {
      this.handleMachineError(e);
    }
  },

  handleMachineError(e) {
    const {
      statusCode
    } = Machine.handleMachineError(e);
    if (statusCode) {
      this.setData({
        errCode: '' + statusCode,
      });
    }
  },

  /**超过按钮显示时间回调 */
  hanldeOutTime(e) {
    let time = e.detail.countdown;
    if (time <= 1) {
      this.setData({
        overTime: 0,
      });
    }
  },

  /**启动洗衣 */
  async goMachineBoot() {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    log
      .push({
        type: 'paysuccess_btn_click',
      })
      .done();
    //蓝牙模块&未开启蓝牙
    if (
      this.data.orderDetail.isBluetooth * 1 === 1 &&
      !(await Bluetooth.openBluetooth())
    ) {
      this.setData({
        openBluetoothShow: true,
      });
      return;
    }
    this.setData({
      isLoading: true,
    });
    this.getOrderStatus();
  },

  /**轮询支付状态 */
  async getOrderStatus() {
    app
      .$post('order/sync', {
        orderNo: this.orderNo,
        payType: this.payType,
      })
      .then(resp => {
        if (resp.code === 0) {
          if (resp.messageId == '') {
            this.setData({
              isLoading: false,
            });
          } else {
            //支持蓝牙且开通走蓝牙流程
            Order.boot(this.data.orderDetail, resp.messageId)
              .then(_ => {
                this.isDisable = false;
                this.setData({
                  isLoading: false,
                });
              })
              .catch(e => {
                this.isDisable = false;
                wx.showToast({
                  icon: 'none',
                  title: '启动失败',
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

  /**蓝牙弹窗关闭 */
  openShowBlueTooth(e) {
    this.isDisable = false;
    this.setData({
      openBluetoothShow: e.detail.status,
    });
  },
});