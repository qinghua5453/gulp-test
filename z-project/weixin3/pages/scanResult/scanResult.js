const app = getApp();
const {
  MachineType
} = app.globalData.utils.Mapping;
const {
  User,
  Machine
} = app.globalData;

Page({
  isDisable: false,
  machineId: null,
  data: {
    reserList: [],
    machine: null,
    shop: null,
  },

  onLoad(options) {
    this.machineId = options.machineId;
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1677FF'
    });
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => {
        this.getUserCurrentLocation();
      }
    });
    this.init();
  },

  async init() {
    let token = await User.check();
    if (token) {
      this.initData();
      this.getMachineDetail();
    }
  },

  getUserCurrentLocation() {
    wx.getLocation({
      type: 'wgs84',
      success: res => {
        let [_latitude, _longitude] = [res.latitude, res.longitude];
        this.getShopOutline(_latitude, _longitude);
      },
      fail(e) {
        console.log(e);
      },
    });
  },

  /**
   *  店铺概览信息
   * @param {*} latitude
   * @param {*} longitude
   */
  async getShopOutline(latitude, longitude) {
    let res = await app.$post('shop/outline', {
      machineId: this.machineId,
      longitude,
      latitude,
    });
    this.setData({
      shop: res || null,
    });
  },

  async initData() {
    let res = await app.$post('appoint/canUseList', {
      machineId: this.machineId,
    });
    if (res && res.items.length > 0) {
      this.setData({
        reserList: res.items,
      });
    }
  },

  async getMachineDetail() {
    let res = await Machine.getDetail(this.machineId);
    if (res) {
      this.setData({
        machine: res,
      });
    }
  },

  /**
   * 立即使用
   */
  async handleStartMachine(e) {
    if (this.isDisable) {
      return;
    }
    this.isDisable = true;
    let item = e.currentTarget.dataset.item;
    let appointOrderId = item.appointOrderId;
    let machineFunctionId = item.machineFunctionId;
    app.$post('appoint/startMachine', {
      appointOrderId
    }).then(res => {
      let orderDetail = res.orderDetail;
      let machineType = MachineType[orderDetail.parentTypeId];
      let url = '';
      if (machineType === 1) {
        url = `/pages/chooseWashMachine/doorClosing/closeTheDoor?machineFunctionId=${machineFunctionId}&appointOrderId=${appointOrderId}&orderId=${orderDetail.id}`;
      } else {
        url = `/pay/payment/paySuccess/paySuccess?orderId=${orderDetail.id}`;
      }
      wx.redirectTo({
        url,
        success: () => {
          this.isDisable = false;
        },
      });
    });
  },

  /**
   * 不使用预约单
   */
  async handleNotUseReser() {
    try {
      let data = await Machine.getDetail(this.machineId);
      let url = `/pages/chooseWashMachine/washMachine/washMachine?machineId=${this.machineId}`;
      switch (data.mode) {
        case 1:
          url = `/pages/chooseWaterMachine/waterMachine/waterMachine?machineId=${this.machineId}`;
          break;
        case 2:
          url = `/pages/chooseChargeMachine/chargeMachine/chargeMachine?machineId=${this.machineId}`;
          break;
      }
      wx.redirectTo({
        url
      });
    } catch (e) {
      const {
        content
      } = Machine.handleMachineError(e);
      if (content)
        setTimeout(() => {
          wx.showToast({
            title: content,
            icon: 'none'
          });
        }, 30);
    }
  },
});