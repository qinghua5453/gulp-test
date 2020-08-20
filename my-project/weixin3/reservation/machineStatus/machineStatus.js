const app = getApp();
const moment = app.globalData.utils.moment;

Page({
  shopId: null,
  setFunctionId: null,
  data: {
    status: null,
    time: null,
    machineData: null,
    machineId: null,
  },

  onLoad(options) {
    wx.setNavigationBarColor({
      frontColor: '#ffffff',
      backgroundColor: '#1976FF'
    });
    this.shopId = options.shopId;
    this.setFunctionId = options.setFunctionId;
    let machineTime = options.time ? decodeURIComponent(options.time) : '';
    this.setData({
      machineId: options.machineId,
      status: options.status,
      time: machineTime ? moment(machineTime).format('h点mm分') : '',
    });
    this.getAvailableMachine(options.machineId);
  },

  //获取可用机器
  async getAvailableMachine(machineId) {
    if (machineId) {
      let res = await app.$post('appoint/getOneAvailableMachine', {
        shopId: this.shopId,
        setFunctionId: this.setFunctionId,
        machineId: machineId,
      });
      if (res) {
        this.setData({
          machineData: res,
        });
      }
    }
  },

  /**
   * 设备详情
   */
  goMachineDetail() {
    if (this.data.machineData) {
      wx.redirectTo({
        url: `/pages/chooseWashMachine/washMachine/washMachine?machineId=${this.data.machineData.id}`,
      });
    }
  },

  /**
   * 返回首页
   */
  goBack() {
    wx.reLaunch({
      url: '/pages/home/home',
    });
  },

  /**
   * 联系客服
   */
  goContact() {
    wx.navigateToMiniProgram({
      appId: '2019080166077530',
    });
  },
});