const app = getApp();
const {
  User,
  Machine
} = app.globalData;
const {
  Http,
  core
} = app.globalData.utils;

Page({
  data: {
    image: '',
    status: '',
    text: '',
    isShowBtn: false,
    isShowTime: false, //是否显示时间
    remainTime: '', //倒计时时间
    showCustomerService: false,
    machineName: null,
    machineId: null,
    isShowcustomerService: false, //是否展示联系平台
    shopCanReserve: false,
  },

  onShow() {
    let nqt = core.getQueryString(app.globalData.qrCode, 'NQT');
    if (!nqt) {
      this.showError();
    } else {
      if (nqt.length === 22) {
        wx.navigateTo({
          url: `/pages/chooseShowerMachine/showerMachine/showerMachine?nqt=${nqt}`,
        });
      } else {
        this.init(nqt);
      }
    }
  },

  async init(nqt) {
    let machineId = null;
    let res;
    // 首次Loading...
    wx.showLoading({
      title: '加载中...',

      mask: true
    });
    try {
      res = await Http.fetch('machine/scan', {
        NQT: nqt
      }, 'POST', false);
      if (res && res.machineId) {
        machineId = res.machineId;
        this.setData({
          machineId: res.machineId,
          shopCanReserve: res.shopCanReserve,
        });
      } else {
        this.showError();
      }
    } catch (e) {
      if (e.code) {
        this.showError(e.code, 'ccl', '设备故障，请更换设备使用');
      } else {
        this.showError();
      }
    }
    // close Loading...
    wx.hideLoading();

    // machineId init Data
    await User.check();
    try {
      if (this.data.shopCanReserve) {
        let reserData = await app.$post('appoint/canUseList', {
          machineId: machineId,
        });
        if (reserData && reserData.items.length > 0) {
          wx.redirectTo({
            url: `/pages/scanResult/scanResult?machineId=${machineId}`,
          });
          return;
        }
      }
      let data = await Machine.getDetail(machineId);
      let url = `/pages/chooseWashMachine/washMachine/washMachine?machineId=${machineId}`;
      switch (data.mode) {
        case 1:
          url = `/pages/chooseWaterMachine/waterMachine/waterMachine?machineId=${machineId}`;
          break;
        case 2:
          url = `/pages/chooseChargeMachine/chargeMachine/chargeMachine?machineId=${machineId}`;
          break;
      }
      wx.redirectTo({
        url
      });
    } catch (e) {
      if (Machine.privateData.detail.name) {
        this.setData({
          machineName: Machine.privateData.detail.name
        });
      }
      this.handleMachineError(e);
    }
  },

  //返回首页
  goHome() {
    wx.reLaunch({
      url: '/pages/home/home',
    });
  },

  //打开联系平台
  openCustomerService() {
    wx.navigateToMiniProgram({
      appId: '2019080166077530',
    });
  },
  //故障上报
  openReport() {
    wx.navigateTo({
      url: `/user/faultReport/faultReport?machineId=${this.data.machineId}`,
    });
  },

  closeCustomerServiceShow() {
    let that = this;
    that.setData({
      showCustomerService: false,
    });
  },

  //拨打电话
  phoneCall(e) {
    let phone = e.currentTarget.dataset.phone;
    wx.makePhoneCall({
      phoneNumber: phone,
    });
  },

  showError(code = 0, image = 'ccl', status = '出错啦', isShowBtn = true) {
    this.setData({
      image,
      status,
      text: code > 0 ? '【故障码：' + code + '】' : '扫码错误，请重新扫码',
      isShowBtn,
    });
    let flag = false;
    if (code === 4000 || code === 4110 || code === 0) {
      flag = true;
    } else {
      flag = false;
    }
    this.setData({
      isShowcustomerService: flag,
    });
  },

  handleMachineError(e) {
    // 机器错误码 2 工作中（非重复下单） 4 故障 7 预约 8 长离线（非蓝牙） 9 已删除 10: 阿里不存在 12: 离线（非蓝牙） 13: IOT其他错误
    switch (e) {
      case 2:
        this.setData({
          image: 'zsy',
          status: '设备工作中,请更换设备使用',
          text: '',
          isShowBtn: true,
          isShowTime: true,
          remainTime: Machine.privateData.detail.remainTime,
        });
        break;
      case 4:
        this.showError(4107, 'ccl', '设备故障，请更换设备使用');
        break;
      case 7:
        this.setData({
          image: 'byy',
          status: '设备被预约',
          text: '请更换设备使用',
          isShowBtn: true,
        });
        break;
      case 8:
        this.showError(4103, 'ccl', '设备故障，请更换设备使用');
        break;
      case 9:
        this.showError(4110, 'ccl', '设备故障，请更换设备使用');
        break;
      case 10:
        this.showError(4201, 'ccl', '设备故障，请更换设备使用');
        break;
      case 12:
        this.showError(4204, 'ccl', '设备故障，请更换设备使用');
        break;
      case 13:
        this.showError(4202, 'ccl', '设备故障，请更换设备使用');
        break;
      default:
        break;
    }
  },
});